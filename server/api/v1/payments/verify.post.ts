import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { verifyRazorpayPaymentSignature } from "../../../utils/payment/razorpay"
import { getStripeClient } from "../../../utils/payment/stripe"

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Checkout"],
    summary: "Verify Client Payment",
    description: "Verify payment authenticity after Flutter SDK completion (Razorpay HMAC signature validation or Stripe PaymentIntent confirmation) and transition the order to kitchen pipeline.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["orderId", "gateway"],
            properties: {
              orderId: { type: "string" },
              gateway: { type: "string", enum: ["RAZORPAY", "STRIPE"] },
              // Razorpay verification parameters
              razorpayOrderId: { type: "string" },
              razorpayPaymentId: { type: "string" },
              razorpaySignature: { type: "string" },
              // Stripe verification parameters
              paymentIntentId: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Payment verified successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string" },
                payment: { type: "object" },
                order: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Invalid signature or payment failed" },
      404: { description: "Order or payment record not found" },
    },
  },
})

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  gateway: z.enum(["RAZORPAY", "STRIPE"]),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paymentIntentId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = verifyPaymentSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid verification payload",
    })
  }

  const {
    orderId,
    gateway,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentIntentId,
  } = parsed.data

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" })
  }

  if (order.userId !== claims.sub && claims.role !== "ADMIN" && claims.role !== "SUPERADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden access to this order" })
  }

  // If already marked as completed, return success idempotently
  if (order.payment?.status === "COMPLETED") {
    return {
      status: "ok",
      message: "Payment already verified and completed",
      payment: order.payment,
      order: {
        id: order.id,
        status: order.status,
      },
    }
  }

  // --- RAZORPAY VERIFICATION ---
  if (gateway === "RAZORPAY") {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing Razorpay verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature)",
      })
    }

    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    })

    if (!isValid) {
      // Mark as failed
      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "FAILED",
            gatewayPaymentId: razorpayPaymentId,
            gatewaySignature: razorpaySignature,
          },
        })
      }

      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Razorpay payment signature. Payment cannot be verified.",
      })
    }

    // Payment is authentic & verified! Update Payment & Order atomically
    const [updatedPayment, updatedOrder] = await prisma.$transaction([
      prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: "COMPLETED",
          gateway: "RAZORPAY",
          method: "RAZORPAY",
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
          transactionId: razorpayPaymentId,
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
          amount: order.totalAmount,
          currency: "INR",
          status: "COMPLETED",
          gateway: "RAZORPAY",
          method: "RAZORPAY",
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
          transactionId: razorpayPaymentId,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: order.status === "PENDING" ? "ACCEPTED" : order.status,
          paymentStatus: "PAID",
        },
      }),
    ])

    return {
      status: "ok",
      message: "Razorpay payment verified and order accepted",
      payment: updatedPayment,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      },
    }
  }

  // --- STRIPE VERIFICATION ---
  if (gateway === "STRIPE") {
    const targetIntentId = paymentIntentId || order.payment?.gatewayOrderId

    if (!targetIntentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing Stripe PaymentIntent ID for verification",
      })
    }

    try {
      const stripe = getStripeClient()
      const intent = await stripe.paymentIntents.retrieve(targetIntentId)

      if (intent.status !== "succeeded") {
        throw createError({
          statusCode: 400,
          statusMessage: `Stripe payment is not completed. Current status: ${intent.status}`,
        })
      }

      const chargeId = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.id

      // Atomically mark Payment COMPLETED & Order ACCEPTED
      const [updatedPayment, updatedOrder] = await prisma.$transaction([
        prisma.payment.upsert({
          where: { orderId: order.id },
          update: {
            status: "COMPLETED",
            gateway: "STRIPE",
            method: "STRIPE",
            gatewayOrderId: intent.id,
            gatewayPaymentId: chargeId,
            transactionId: chargeId,
          },
          create: {
            orderId: order.id,
            userId: order.userId,
            restaurantId: order.restaurantId,
            amount: order.totalAmount,
            currency: (intent.currency || "USD").toUpperCase(),
            status: "COMPLETED",
            gateway: "STRIPE",
            method: "STRIPE",
            gatewayOrderId: intent.id,
            gatewayPaymentId: chargeId,
            transactionId: chargeId,
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: order.status === "PENDING" ? "ACCEPTED" : order.status,
            paymentStatus: "PAID",
          },
        }),
      ])

      return {
        status: "ok",
        message: "Stripe payment confirmed and order accepted",
        payment: updatedPayment,
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus,
        },
      }
    } catch (err: any) {
      console.error("[Stripe Verify Error]", err)
      throw createError({
        statusCode: err?.statusCode || 500,
        statusMessage: err?.message || "Failed to verify Stripe payment",
      })
    }
  }

  throw createError({ statusCode: 400, statusMessage: "Unsupported payment gateway" })
})
