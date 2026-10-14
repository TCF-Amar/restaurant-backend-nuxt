import type { Prisma } from "@prisma/client"

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Menu Items"],
    summary: "List menu items / dishes",
    description: "Fetch paginated dishes and menu items for a restaurant, with optional category and keyword search filters, variants, and addons.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "categoryId", in: "query", schema: { type: "string" }, description: "Filter by category ID or ALL" },
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by dish name or description" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 9 } },
      { name: "all", in: "query", schema: { type: "boolean" } },
    ],
    responses: {
      200: { description: "Menu items list" },
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

  const query = getQuery(event)
  const categoryId = query.categoryId && query.categoryId !== "ALL" ? String(query.categoryId) : undefined
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"
  const { page, limit, skip } = getPaginationParams(event, 9)

  const where: Prisma.MenuItemWhereInput = {
    restaurantId,
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [total, menuItems] = await Promise.all([
    prisma.menuItem.count({ where }),
    prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, restaurantId: true },
        },
        variants: {
          orderBy: { price: "asc" },
        },
        addons: {
          orderBy: { price: "asc" },
        },
      },
      ...(returnAll ? {} : { skip, take: limit }),
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    status: "ok",
    menuItems,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
  }
})
