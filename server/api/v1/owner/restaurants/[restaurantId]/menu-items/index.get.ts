import type { Prisma } from "@prisma/client"

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
