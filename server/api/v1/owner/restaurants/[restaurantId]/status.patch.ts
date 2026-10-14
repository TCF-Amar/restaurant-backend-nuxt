import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Owner Restaurants"],
    summary: "Toggle restaurant active status",
    description: "Open or close restaurant for taking live orders. If isActive is omitted, inverts the current status.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              isActive: { type: "boolean", description: "Set explicitly to true (open) or false (closed)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Restaurant status updated" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Restaurant not found" },
    },
  },
})

const toggleStatusSchema = z.object({
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Restaurant ID is required",
    })
  }

  // Permission check: requires MANAGE_OUTLET (Admins have global access, owners must have permission)
  await requireRestaurantAccess(event, restaurantId, "MANAGE_OUTLET")

  // Check restaurant exists
  const existing = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, slug: true, isActive: true },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Restaurant not found",
    })
  }

  // Parse optional body
  let targetStatus: boolean
  try {
    const body = await readBody(event)
    const parsed = toggleStatusSchema.safeParse(body || {})
    if (parsed.success && parsed.data.isActive !== undefined) {
      targetStatus = parsed.data.isActive
    } else {
      targetStatus = !existing.isActive
    }
  } catch {
    targetStatus = !existing.isActive
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
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
    message: `Restaurant status updated to ${updated.isActive ? "active" : "inactive"}`,
    restaurant: updated,
  }
})
