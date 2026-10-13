

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can unassign owners
  requireAdmin(event)

  const restaurantId = getRouterParam(event, "id")
  const userId = getRouterParam(event, "userId")

  if (!restaurantId || !userId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID and User ID are required" })
  }

  await prisma.restaurantStaff.delete({
    where: {
      userId_restaurantId: {
        userId,
        restaurantId,
      },
    },
  })

  return {
    status: "ok",
    message: "User unassigned from restaurant successfully",
  }
})
