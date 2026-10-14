import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin Restaurant Management"],
    summary: "Toggle restaurant status by ID",
    description: "Activate or deactivate restaurant outlet using path parameter ID. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              isActive: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Restaurant status updated" },
      400: { description: "Invalid ID" },
      403: { description: "Forbidden" },
      404: { description: "Restaurant not found" },
    },
  },
})

const toggleSchema = z.object({
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const restaurantId = getRouterParam(event, "id")
  if (!restaurantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Restaurant ID is required",
    })
  }

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

  let targetStatus: boolean
  try {
    const body = await readBody(event)
    const parsed = toggleSchema.safeParse(body || {})
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
