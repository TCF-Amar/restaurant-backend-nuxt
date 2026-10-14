import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { createRazorpayOrder, getRazorpayKeyId } from "../../../utils/payment/razorpay"
import { createStripePaymentIntent, getStripePublishableKey } from "../../../utils/payment/stripe"

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Checkout"],
    summary: "Initialize Online Payment Intent (UPI / Card)",
    description: "Generate a Razorpay Order ID (for UPI apps / Indian Netbanking & Cards) or Stripe PaymentIntent (for Global Cards & Apple/Google Pay) for a created order.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["orderId", "gateway"],
            properties: {
              orderId: { type: "string", description: "Internal order ID" },
              gateway: { type: "string", enum: ["RAZORPAY", "STRIPE"], example: "RAZORPAY" },
              currency: { type: "string", example: "INR", description: "Currency code (default INR for Razorpay, USD for Stripe)" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Payment intent successfully generated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                gateway: { type: "string", example: "RAZORPAY" },
                orderId: { type: "string" },
                amount: { type: "number" },
                currency: { type: "string" },
                keyId: { type: "string" },
                clientSecret: { type: "string" },
                publishableKey: { type: "string" },
              },
            },
          },
        },
      },
      400: { description: "Invalid input or order already paid" },
      404: { description: "Order not found" },
    },
  },
})

const createIntentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  gateway: z.enum(["RAZORPAY", "STRIPE"]),
  currency: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = createIntentSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid payment intent parameters",
    })
  }

  const { orderId, gateway, currency } = parsed.data

  // Fetch target order with payment and user details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" })
  }

  // Ensure user is the order owner or admin
  if (order.userId !== claims.sub && claims.role !== "ADMIN" && claims.role !== "SUPERADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden access to this order" })
  }

  if (order.payment?.status === "COMPLETED") {
    throw createError({ statusCode: 400, statusMessage: "This order has already been paid for" })
  }

  const orderAmount = Number(order.totalAmount)

  if (gateway === "RAZORPAY") {
    const selectedCurrency = (currency || "INR").toUpperCase()

    try {
      const rzpOrder = await createRazorpayOrder({
        amount: orderAmount,
        currency: selectedCurrency,
        receipt: order.id,
        notes: {
          orderId: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
          restaurantName: order.restaurant.name,
        },
      })

      // Upsert / update payment record
      await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          gateway: "RAZORPAY",
          method: "RAZORPAY",
          gatewayOrderId: rzpOrder.id,
          status: "PENDING",
          currency: selectedCurrency,
          amount: orderAmount,
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
          amount: orderAmount,
          currency: selectedCurrency,
          status: "PENDING",
          method: "RAZORPAY",
          gateway: "RAZORPAY",
          gatewayOrderId: rzpOrder.id,
          transactionId: `TXN-${order.id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        },
      })

      return {
        status: "ok",
        gateway: "RAZORPAY",
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency,
        keyId: getRazorpayKeyId(),
        customer: {
          name: order.user?.fullName || "",
          email: order.user?.email || "",
          phone: order.user?.phone || "",
        },
        businessName: order.restaurant.name,
      }
    } catch (err: any) {
      console.error("[Razorpay Error]", err)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create Razorpay order: ${err?.message || "Internal error"}`,
      })
    }
  }

  if (gateway === "STRIPE") {
    const selectedCurrency = (currency || "USD").toLowerCase()

    try {
      const paymentIntent = await createStripePaymentIntent({
        amount: orderAmount,
        currency: selectedCurrency,
        orderId: order.id,
        customerEmail: order.user?.email,
        metadata: {
          orderId: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
        },
      })

      // Upsert / update payment record
      await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          gateway: "STRIPE",
          method: "STRIPE",
          gatewayOrderId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: "PENDING",
          currency: selectedCurrency.toUpperCase(),
          amount: orderAmount,
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
          amount: orderAmount,
          currency: selectedCurrency.toUpperCase(),
          status: "PENDING",
          method: "STRIPE",
          gateway: "STRIPE",
          gatewayOrderId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          transactionId: `TXN-${order.id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        },
      })

      return {
        status: "ok",
        gateway: "STRIPE",
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: getStripePublishableKey(),
        amount: Math.round(orderAmount * 100), // in cents
        currency: selectedCurrency.toUpperCase(),
        customer: {
          name: order.user?.fullName || "",
          email: order.user?.email || "",
        },
      }
    } catch (err: any) {
      console.error("[Stripe Error]", err)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create Stripe PaymentIntent: ${err?.message || "Internal error"}`,
      })
    }
  }

  throw createError({ statusCode: 400, statusMessage: "Unsupported payment gateway" })
})
