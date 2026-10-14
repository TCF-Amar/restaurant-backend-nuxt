import { prisma } from "../../../../utils/prisma"
import { verifyRazorpayWebhookSignature } from "../../../../utils/payment/razorpay"

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Checkout"],
    summary: "Razorpay Webhook Handler",
    description: "Receive asynchronous webhook notifications from Razorpay servers (e.g. order.paid, payment.captured, payment.failed) to ensure tamper-proof order fulfillment.",
    responses: {
      200: { description: "Webhook acknowledged" },
      400: { description: "Invalid signature or payload" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, "x-razorpay-signature")
  const rawBody = await readRawBody(event, "utf-8")

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: "Empty webhook payload" })
  }

  // Validate webhook signature if signature is present
  if (signature) {
    const isValid = verifyRazorpayWebhookSignature({
      bodyString: rawBody,
      signature,
    })

    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid signature received")
      throw createError({ statusCode: 400, statusMessage: "Invalid webhook signature" })
    }
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid JSON format" })
  }

  const eventType = body?.event || "unknown"
  const eventId = body?.event_id || `rzp_evt_${Date.now()}`

  // Log the webhook payload
  await prisma.paymentWebhookLog.create({
    data: {
      gateway: "RAZORPAY",
      eventId,
      eventType,
      payload: body,
      processed: false,
    },
  }).catch((e) => console.warn("[Webhook Log Error]", e.message))

  // Process standard successful payment events: 'order.paid' or 'payment.captured'
  if (eventType === "order.paid" || eventType === "payment.captured") {
    const paymentEntity = body?.payload?.payment?.entity
    const orderEntity = body?.payload?.order?.entity

    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id
    const rzpPaymentId = paymentEntity?.id

    if (rzpOrderId) {
      // Find corresponding payment record
      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: rzpOrderId },
        include: { order: true },
      })

      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              gatewayPaymentId: rzpPaymentId || payment.gatewayPaymentId,
              transactionId: rzpPaymentId || payment.transactionId,
              gatewayResponse: body,
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: (payment.order.status === "PAYMENT_PENDING" || payment.order.status === "PENDING") ? "ACCEPTED" : payment.order.status,
              paymentStatus: "PAID",
            },
          }),
          prisma.cartItem.deleteMany({
            where: { cart: { userId: payment.order.userId } },
          }),
          prisma.paymentWebhookLog.updateMany({
            where: { eventId },
            data: { processed: true },
          }),
        ])
      }
    }
  }

  // Handle payment failures
  if (eventType === "payment.failed") {
    const paymentEntity = body?.payload?.payment?.entity
    const rzpOrderId = paymentEntity?.order_id

    if (rzpOrderId) {
      await prisma.payment.updateMany({
        where: { gatewayOrderId: rzpOrderId },
        data: {
          status: "FAILED",
          gatewayResponse: body,
        },
      })
    }
  }

  return { status: "ok", received: true }
})
