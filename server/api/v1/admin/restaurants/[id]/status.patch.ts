import z from "zod"

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
