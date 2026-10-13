

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
