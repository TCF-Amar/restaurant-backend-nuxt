import fs from "node:fs/promises"
import path from "node:path"

defineRouteMeta({
  openAPI: {
    tags: ["Documentation & Integration Guides"],
    summary: "Fetch Order & Payment Architecture Guide (Markdown & JSON)",
    description: "Fetch complete architectural documentation for Cart, Charges breakdown, Cash on Delivery, UPI (Razorpay), Card (Stripe), Signature Verification, and Webhook fulfillment. Returns raw markdown and parsed endpoint directory.",
    responses: {
      200: {
        description: "Order and payment architecture documentation",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                title: { type: "string" },
                version: { type: "string" },
                lastUpdated: { type: "string" },
                markdown: { type: "string" },
                endpoints: { type: "array" },
              },
            },
          },
        },
      },
    },
  },
})

let cachedDoc: string | null = null

export default defineEventHandler(async (event) => {
  if (!cachedDoc) {
    try {
      const docPath = path.resolve(process.cwd(), "docs", "ORDER_PAYMENT_FLOW.md")
      cachedDoc = await fs.readFile(docPath, "utf-8")
    } catch (err) {
      console.warn("[Doc Reader Warning] Unable to read from filesystem, using fallback", err)
      cachedDoc = "# Order & Payment Architecture Documentation\n\nPlease refer to docs/ORDER_PAYMENT_FLOW.md in repository root."
    }
  }

  return {
    status: "ok",
    title: "Artisan Delivery Platform — Order & Payment Architecture Flow",
    version: "1.0.0",
    lastUpdated: "2026-10-14",
    gatewaysSupported: ["CASH_ON_DELIVERY", "RAZORPAY_UPI", "STRIPE_CARD", "WALLET"],
    endpoints: [
      {
        path: "/api/v1/cart/items",
        method: "POST",
        summary: "Add or increment item in cart",
        auth: "Bearer",
      },
      {
        path: "/api/v1/cart",
        method: "GET",
        summary: "Get cart with dynamic charges breakdown (subtotal, delivery, tax, packaging, total)",
        auth: "Bearer",
      },
      {
        path: "/api/v1/cart/items/:id",
        method: "PATCH",
        summary: "Update cart item quantity",
        auth: "Bearer",
      },
      {
        path: "/api/v1/cart/items/:id",
        method: "DELETE",
        summary: "Remove specific item from cart",
        auth: "Bearer",
      },
      {
        path: "/api/v1/cart",
        method: "DELETE",
        summary: "Clear shopping cart",
        auth: "Bearer",
      },
      {
        path: "/api/v1/cart/calculate",
        method: "POST",
        summary: "Live fee calculation without saving to DB",
        auth: "Optional",
      },
      {
        path: "/api/v1/cart/checkout",
        method: "POST",
        summary: "Checkout cart (instant placement for COD, or PAYMENT_PENDING + intent generation for UPI/Cards)",
        auth: "Bearer",
      },
      {
        path: "/api/v1/payments/create-intent",
        method: "POST",
        summary: "Generate Razorpay order ID or Stripe clientSecret for existing order",
        auth: "Bearer",
      },
      {
        path: "/api/v1/payments/verify",
        method: "POST",
        summary: "Cryptographically verify payment signature & transition order to kitchen queue",
        auth: "Bearer",
      },
      {
        path: "/api/v1/payments/webhooks/razorpay",
        method: "POST",
        summary: "Asynchronous Razorpay server-to-server webhook handler",
        auth: "x-razorpay-signature",
      },
      {
        path: "/api/v1/payments/webhooks/stripe",
        method: "POST",
        summary: "Asynchronous Stripe server-to-server webhook handler",
        auth: "stripe-signature",
      },
      {
        path: "/api/v1/payments",
        method: "GET",
        summary: "Admin & restaurant owner payments ledger",
        auth: "Bearer (Admin/Staff)",
      },
      {
        path: "/api/v1/payments/:id/status",
        method: "PATCH",
        summary: "Update payment settlement status or issue refund",
        auth: "Bearer (Admin/Staff)",
      },
    ],
    markdown: cachedDoc,
  }
})
