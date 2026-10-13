

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  await requireRestaurantAccess(event, restaurantId)

  const categories = await prisma.category.findMany({
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
      { restaurantId: "asc" }, // Global categories first (nulls first), then outlet-specific
      { name: "asc" },
    ],
  })

  return {
    status: "ok",
    categories,
  }
})
