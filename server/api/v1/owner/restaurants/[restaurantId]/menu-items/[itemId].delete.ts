

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Menu Items"],
    summary: "Delete menu item / dish",
    description: "Permanently delete a dish from the restaurant menu. Requires MANAGE_MENU_ITEMS permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "itemId", in: "path", required: true, schema: { type: "string" }, description: "Menu Item ID" },
    ],
    responses: {
      200: { description: "Menu item deleted successfully" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Menu item not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  const itemId = getRouterParam(event, "itemId")

  if (!restaurantId || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid parameters" })
  }

  await requireRestaurantAccess(event, restaurantId, "MANAGE_MENU_ITEMS")

  const existing = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Menu item not found in this restaurant" })
  }

  await prisma.menuItem.delete({
    where: { id: itemId },
  })

  return {
    status: "ok",
    message: "Menu item deleted successfully",
  }
})
