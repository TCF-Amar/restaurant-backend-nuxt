

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Categories"],
    summary: "Delete category",
    description: "Delete a restaurant-specific category if no dishes are linked to it. Requires MANAGE_CATEGORIES permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "categoryId", in: "path", required: true, schema: { type: "string" }, description: "Category ID" },
    ],
    responses: {
      200: { description: "Category deleted successfully" },
      400: { description: "Cannot delete category containing dishes" },
      403: { description: "Forbidden" },
      404: { description: "Category not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  const categoryId = getRouterParam(event, "categoryId")

  if (!restaurantId || !categoryId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid parameters" })
  }

  const { isSuperAdmin } = await requireRestaurantAccess(event, restaurantId, "MANAGE_CATEGORIES")

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          menuItems: {
            where: { restaurantId },
          },
        },
      },
    },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" })
  }

  // If global category, only Admin can delete it
  if (existing.restaurantId === null && !isSuperAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Global platform categories can only be deleted by administrators" })
  }

  // If owned by another restaurant and caller is not Admin
  if (existing.restaurantId !== null && existing.restaurantId !== restaurantId && !isSuperAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Category does not belong to this restaurant" })
  }

  await prisma.category.delete({
    where: { id: categoryId },
  })

  return {
    status: "ok",
    message: `Category "${existing.name}" deleted successfully`,
  }
})
