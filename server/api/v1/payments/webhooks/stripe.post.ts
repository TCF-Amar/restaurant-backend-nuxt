import { prisma } from "../../../../utils/prisma"
import { constructStripeWebhookEvent } from "../../../../utils/payment/stripe"
import type Stripe from "stripe"

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Checkout"],
    summary: "Stripe Webhook Handler",
    description: "Receive asynchronous webhook notifications from Stripe servers (payment_intent.succeeded, payment_intent.payment_failed) to guarantee payment settlement even if mobile app drops connection.",
    responses: {
      200: { description: "Webhook acknowledged" },
      400: { description: "Invalid signature or webhook construction error" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, "stripe-signature")
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: "Empty webhook payload" })
  }

  let stripeEvent: Stripe.Event

  // Verify Stripe signature if configured
  if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      stripeEvent = constructStripeWebhookEvent(rawBody, signature)
    } catch (err: any) {
      console.warn("[Stripe Webhook Error]", err.message)
      throw createError({ statusCode: 400, statusMessage: `Webhook signature verification failed: ${err.message}` })
    }
  } else {
    // Development fallback without signature verification
    try {
      const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8")
      stripeEvent = JSON.parse(bodyStr)
    } catch {
      throw createError({ statusCode: 400, statusMessage: "Invalid JSON format" })
    }
  }

  const eventType = stripeEvent.type
  const eventId = stripeEvent.id

  // Log webhook
  await prisma.paymentWebhookLog.create({
    data: {
      gateway: "STRIPE",
      eventId,
      eventType,
      payload: stripeEvent as any,
      processed: false,
    },
  }).catch((e) => console.warn("[Webhook Log Error]", e.message))

  // Process successful payment intent
  if (eventType === "payment_intent.succeeded") {
    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
    const intentId = paymentIntent.id
    const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : intentId

    const payment = await prisma.payment.findFirst({
      where: { gatewayOrderId: intentId },
      include: { order: true },
    })

    if (payment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            gatewayPaymentId: chargeId,
            transactionId: chargeId,
            gatewayResponse: paymentIntent as any,
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

  // Handle payment failures
  if (eventType === "payment_intent.payment_failed") {
    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
    const intentId = paymentIntent.id

    await prisma.payment.updateMany({
      where: { gatewayOrderId: intentId },
      data: {
        status: "FAILED",
        gatewayResponse: paymentIntent as any,
      },
    })
  }

  return { status: "ok", received: true }
})
