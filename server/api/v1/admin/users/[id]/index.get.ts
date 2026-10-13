export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const userId = getRouterParam(event, "id")
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isSuspended: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      _count: {
        select: {
          orders: true,
          sessions: true,
        },
      },
      restaurantStaff: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  // Also fetch all available restaurants so admin can easily assign
  const availableRestaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  })

  return {
    status: "ok",
    user,
    availableRestaurants,
  }
})
