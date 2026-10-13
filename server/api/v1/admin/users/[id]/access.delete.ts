export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const userId = getRouterParam(event, "id")
  const query = getQuery(event)
  const restaurantId = String(query.restaurantId || "")

  if (!userId || !restaurantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Both User ID and Restaurant ID are required",
    })
  }

  await prisma.restaurantStaff.deleteMany({
    where: {
      userId,
      restaurantId,
    },
  })

  return {
    status: "ok",
    message: "Restaurant staff assignment revoked successfully",
  }
})
