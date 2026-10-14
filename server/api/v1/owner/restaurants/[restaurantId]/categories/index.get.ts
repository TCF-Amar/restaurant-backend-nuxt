

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Categories"],
    summary: "List restaurant categories",
    description: "Fetch all active categories for a restaurant, including global system categories and restaurant-specific custom categories.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
    ],
    responses: {
      200: { description: "Categories list retrieved successfully" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  },
})

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
