import { z } from "zod"
import { calculateCartPricing } from "../../../utils/cart/pricing"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Live calculate cart items & fee breakdown",
    description: "Calculate accurate real-time item prices, variants, addons, delivery fees, taxes, packaging fees, and grand total without saving to DB. Ideal for instant cart previews.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["restaurantId", "items"],
            properties: {
              restaurantId: { type: "string" },
              currency: { type: "string", example: "INR", default: "INR" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  required: ["menuItemId", "quantity"],
                  properties: {
                    menuItemId: { type: "string" },
                    quantity: { type: "integer", default: 1 },
                    variantId: { type: "string", nullable: true },
                    addonIds: { type: "array", items: { type: "string" } },
                    notes: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Calculated pricing breakdown",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                breakdown: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Invalid items or restaurant" },
    },
  },
})

const calculateSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  currency: z.string().optional().default("INR"),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "menuItemId is required"),
        quantity: z.number().int().min(1).max(99).default(1),
        variantId: z.string().optional().nullable(),
        addonIds: z.array(z.string()).optional().nullable().default([]),
        notes: z.string().optional().nullable(),
      })
    )
    .min(1, "At least 1 item is required"),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = calculateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid calculation payload",
    })
  }

  const { restaurantId, items, currency } = parsed.data

  const breakdown = await calculateCartPricing(restaurantId, items, currency)

  return {
    status: "ok",
    breakdown,
  }
})
