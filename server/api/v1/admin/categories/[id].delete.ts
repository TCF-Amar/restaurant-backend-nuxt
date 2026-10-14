defineRouteMeta({
  openAPI: {
    tags: ["Global & Admin Categories"],
    summary: "Delete category",
    description: "Delete a category if no dishes or menu items are linked to it. Admins can delete global and restaurant categories; owners can only delete their own.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Category ID" },
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
  const auth = requireAuth(event)

  const categoryId = getRouterParam(event, "id")
  if (!categoryId) {
    throw createError({ statusCode: 400, statusMessage: "Category ID is required" })
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { menuItems: true },
      },
    },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" })
  }

  if (auth.role !== "ADMIN") {
    if (!existing.restaurantId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Global platform categories can only be deleted by administrators",
      })
    }
    await requireRestaurantAccess(event, existing.restaurantId, "MANAGE_CATEGORIES")
  }

  const query = getQuery(event)
  const force = query.force === "true" || query.force === "1"

  if (existing._count.menuItems > 0 && !force) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot delete: ${existing._count.menuItems} menu item(s) are currently attached to "${existing.name}". Pass force=true to delete anyway.`,
    })
  }

  await prisma.category.delete({
    where: { id: categoryId },
  })

  return {
    status: "ok",
    message: `Category "${existing.name}" deleted successfully`,
  }
})
