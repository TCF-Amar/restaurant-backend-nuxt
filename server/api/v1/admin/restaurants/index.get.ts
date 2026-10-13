

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can list all restaurants globally
  requireAdmin(event)

  const restaurants = await prisma.restaurant.findMany({
    include: {
      owners: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          categories: true,
          menuItems: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return {
    status: "ok",
    restaurants,
  }
})
