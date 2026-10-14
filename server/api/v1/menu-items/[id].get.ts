import { prisma } from "../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Customer Menu & Dishes (Mobile App)"],
    summary: "Get single dish / menu item details",
    description: "Fetch full details of a specific menu item, including its active variants, addons, category, and restaurant outlet.",
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Menu item ID" },
    ],
    responses: {
      200: { description: "Dish details retrieved successfully" },
      404: { description: "Menu item not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Menu item ID is required" })
  }

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          phone: true,
          logoUrl: true,
          isActive: true,
        },
      },
      variants: {
        select: {
          id: true,
          name: true,
          price: true,
        },
        orderBy: { price: "asc" },
      },
      addons: {
        select: {
          id: true,
          name: true,
          price: true,
        },
        orderBy: { price: "asc" },
      },
    },
  })

  if (!item || !item.isAvailable || (item.restaurant && !item.restaurant.isActive)) {
    throw createError({ statusCode: 404, statusMessage: "Dish is currently unavailable or not found" })
  }

  return {
    status: "ok",
    item,
  }
})
