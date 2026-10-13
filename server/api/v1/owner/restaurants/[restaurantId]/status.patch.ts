import z from "zod"

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
