import crypto from "node:crypto"
import Razorpay from "razorpay"

let razorpayInstance: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  if (razorpayInstance) return razorpayInstance

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NUXT_RAZORPAY_KEY_ID || "rzp_test_placeholder"
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.NUXT_RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder"

  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  })

  return razorpayInstance
}

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || process.env.NUXT_RAZORPAY_KEY_ID || "rzp_test_placeholder"
}

export interface CreateRazorpayOrderOptions {
  amount: number // in primary currency unit (e.g. 500 for INR 500.00)
  currency?: string // default INR
  receipt: string
  notes?: Record<string, string>
}

/**
 * Creates an order on Razorpay for UPI / Card checkout
 */
export async function createRazorpayOrder(options: CreateRazorpayOrderOptions) {
  const razorpay = getRazorpayClient()
  const currency = (options.currency || "INR").toUpperCase()

  // Convert to paise / smallest sub-unit (e.g. 100 paise = 1 INR)
  const amountInSubunits = Math.round(options.amount * 100)

  const order = await razorpay.orders.create({
    amount: amountInSubunits,
    currency,
    receipt: options.receipt,
    notes: options.notes,
  })

  return order
}

/**
 * Validates the authenticity of the client payment response from Razorpay Standard Checkout / UPI
 */
export function verifyRazorpayPaymentSignature(options: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || process.env.NUXT_RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder"
  const payload = `${options.orderId}|${options.paymentId}`

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return generatedSignature === options.signature
}

/**
 * Validates Razorpay Webhook signature
 */
export function verifyRazorpayWebhookSignature(options: {
  bodyString: string
  signature: string
}): boolean {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.NUXT_RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "rzp_test_secret_placeholder"

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(options.bodyString)
    .digest("hex")

  return generatedSignature === options.signature
}
