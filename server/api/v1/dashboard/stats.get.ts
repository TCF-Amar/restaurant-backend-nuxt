export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)

  if (auth.role === "ADMIN") {
    const [
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      revenueResult,
      recentOrders,
      recentRestaurants,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          restaurant: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.restaurant.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { menuItems: true, orders: true, categories: true },
          },
        },
      }),
    ])

    return {
      status: "ok",
      role: auth.role,
      metrics: {
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
      },
      recentOrders,
      recentRestaurants,
    }
  }

  if (auth.role === "RESTAURANT_OWNER") {
    const staffEntries = await prisma.restaurantStaff.findMany({
      where: { userId: auth.sub },
      select: { restaurantId: true },
    })

    const restaurantIds = staffEntries.map((s) => s.restaurantId)

    const [totalRestaurants, totalOrders, revenueResult, recentOrders] =
      await Promise.all([
        restaurantIds.length,
        prisma.order.count({
          where: { restaurantId: { in: restaurantIds } },
        }),
        prisma.order.aggregate({
          where: { restaurantId: { in: restaurantIds } },
          _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
          where: { restaurantId: { in: restaurantIds } },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            restaurant: { select: { id: true, name: true, slug: true } },
          },
        }),
      ])

    return {
      status: "ok",
      role: auth.role,
      metrics: {
        totalRestaurants,
        activeRestaurants: totalRestaurants,
        totalUsers: 0,
        totalOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
      },
      recentOrders,
      recentRestaurants: [],
    }
  }

  // Customer view: only their orders
  const [totalOrders, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: auth.sub } }),
    prisma.order.findMany({
      where: { userId: auth.sub },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { id: true, name: true, slug: true } },
      },
    }),
  ])

  return {
    status: "ok",
    role: auth.role,
    metrics: {
      totalRestaurants: 0,
      activeRestaurants: 0,
      totalUsers: 0,
      totalOrders,
      totalRevenue: 0,
    },
    recentOrders,
    recentRestaurants: [],
  }
})
