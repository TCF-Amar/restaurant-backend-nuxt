import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (stripeInstance) return stripeInstance

  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.NUXT_STRIPE_SECRET_KEY ||
    "sk_test_placeholder_key"

  stripeInstance = new Stripe(secretKey)

  return stripeInstance
}

export function getStripePublishableKey(): string {
  return (
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NUXT_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_placeholder_key"
  )
}

export interface CreateStripePaymentIntentOptions {
  amount: number // in major unit (e.g. 25.50 USD)
  currency?: string // default "USD"
  orderId: string
  customerEmail?: string
  metadata?: Record<string, string>
}

/**
 * Creates a Stripe PaymentIntent for Card / Payment Sheet checkout
 */
export async function createStripePaymentIntent(options: CreateStripePaymentIntentOptions) {
  const stripe = getStripeClient()
  const currency = (options.currency || "USD").toLowerCase()

  // Convert to cents / lowest unit
  const amountInCents = Math.round(options.amount * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId: options.orderId,
      ...(options.metadata || {}),
    },
    receipt_email: options.customerEmail,
  })

  return paymentIntent
}

/**
 * Constructs and verifies incoming Stripe Webhook events
 */
export function constructStripeWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripeClient()
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.NUXT_STRIPE_WEBHOOK_SECRET ||
    "whsec_placeholder"

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}
