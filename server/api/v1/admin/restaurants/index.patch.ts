import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin Restaurant Management"],
    summary: "Toggle restaurant active status (Admin)",
    description: "Admin global toggle to activate or deactivate any restaurant outlet. Revokes order intake when closed.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["restaurantId"],
            properties: {
              restaurantId: { type: "string" },
              isActive: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Restaurant status updated successfully" },
      400: { description: "Invalid payload" },
      403: { description: "Forbidden" },
      404: { description: "Restaurant not found" },
    },
  },
})

const adminToggleSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can use this route
  requireAdmin(event)

  const body = await readBody(event)
  const parsed = adminToggleSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid payload",
    })
  }

  const existing = await prisma.restaurant.findUnique({
    where: { id: parsed.data.restaurantId },
    select: { id: true, name: true, slug: true, isActive: true },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Restaurant not found",
    })
  }

  const targetStatus =
    parsed.data.isActive !== undefined ? parsed.data.isActive : !existing.isActive

  const updated = await prisma.restaurant.update({
    where: { id: parsed.data.restaurantId },
    data: { isActive: targetStatus },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      updatedAt: true,
    },
  })

  return {
    status: "ok",
    message: `Restaurant ${updated.name} status updated to ${updated.isActive ? "active" : "inactive"}`,
    restaurant: updated,
  }
})
