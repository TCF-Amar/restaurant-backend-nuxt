

defineRouteMeta({
  openAPI: {
    tags: ["Admin Restaurant Management"],
    summary: "List all restaurants globally",
    description: "Fetch all restaurants across the platform with owner details and dish counters. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Restaurants list" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  },
})

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
