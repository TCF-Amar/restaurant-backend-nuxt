import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Owner Restaurants"],
    summary: "Update restaurant profile",
    description: "Update restaurant name, description, address, phone, logo, or banner. Requires MANAGE_OUTLET permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", example: "Artisan Trattoria" },
              description: { type: "string" },
              address: { type: "string" },
              phone: { type: "string" },
              logoUrl: { type: "string" },
              bannerUrl: { type: "string" },
              isActive: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Restaurant profile updated successfully" },
      400: { description: "Validation error" },
      403: { description: "Forbidden" },
      404: { description: "Restaurant not found" },
    },
  },
})


const updateDetailsSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  // Permission check: requires MANAGE_OUTLET
  await requireRestaurantAccess(event, restaurantId, "MANAGE_OUTLET")

  const body = await readBody(event)
  const parsed = updateDetailsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid input",
    })
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.logoUrl !== undefined ? { logoUrl: parsed.data.logoUrl || null } : {}),
      ...(parsed.data.bannerUrl !== undefined ? { bannerUrl: parsed.data.bannerUrl || null } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
  })

  return {
    status: "ok",
    restaurant: updated,
  }
})
