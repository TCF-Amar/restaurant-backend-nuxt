

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  // Verifies caller has access to this outlet
  const { staffPermissions, isSuperAdmin } = await requireRestaurantAccess(event, restaurantId)

  const [restaurant, availableCategories] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        _count: {
          select: { categories: true, menuItems: true, orders: true, owners: true },
        },
        owners: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isSuspended: true,
              },
            },
          },
          orderBy: { isPrimary: "desc" },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { restaurantId },
          { restaurantId: null },
        ],
      },
      include: {
        _count: {
          select: {
            menuItems: {
              where: { restaurantId },
            },
          },
        },
      },
      orderBy: [
        { restaurantId: "asc" },
        { name: "asc" },
      ],
    }),
  ])

  if (!restaurant) {
    throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })
  }

  // Attach all available categories (both global and outlet-specific)
  ; (restaurant as any).categories = availableCategories

  return {
    status: "ok",
    restaurant,
    permissions: staffPermissions,
    isSuperAdmin,
  }
})
