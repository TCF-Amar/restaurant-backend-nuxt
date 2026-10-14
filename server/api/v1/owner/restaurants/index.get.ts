

import type { Prisma } from "@prisma/client"

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)

  const query = getQuery(event)
  const returnAll = query.all === "true" || query.all === "1"
  const search = query.search ? String(query.search).trim() : undefined
  const statusFilter = query.status ? String(query.status) : undefined
  const { page, limit, skip } = getPaginationParams(event, 9)

  const whereRestaurant: Prisma.RestaurantWhereInput = {
    ...(statusFilter === "ACTIVE" ? { isActive: true } : statusFilter === "INACTIVE" ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  // If Admin: can see all restaurants
  if (auth.role === "ADMIN") {
    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where: whereRestaurant }),
      prisma.restaurant.findMany({
        where: whereRestaurant,
        include: {
          _count: {
            select: { categories: true, menuItems: true, orders: true },
          },
        },
        ...(returnAll ? {} : { skip, take: limit }),
        orderBy: { createdAt: "desc" },
      }),
    ])

    return {
      status: "ok",
      restaurants: restaurants.map((r) => ({
        ...r,
        permissions: ["MANAGE_OUTLET", "MANAGE_CATEGORIES", "MANAGE_MENU_ITEMS", "MANAGE_ORDERS"],
      })),
      pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
    }
  }

  // If RESTAURANT_OWNER: return ONLY assigned restaurants with their permissions
  if (auth.role === "RESTAURANT_OWNER") {
    const staffWhere = {
      userId: auth.sub,
      restaurant: whereRestaurant,
    }

    const [total, assignments] = await Promise.all([
      prisma.restaurantStaff.count({ where: staffWhere }),
      prisma.restaurantStaff.findMany({
        where: staffWhere,
        include: {
          restaurant: {
            include: {
              _count: {
                select: { categories: true, menuItems: true, orders: true },
              },
            },
          },
        },
        ...(returnAll ? {} : { skip, take: limit }),
        orderBy: { isPrimary: "desc" },
      }),
    ])

    return {
      status: "ok",
      restaurants: assignments.map((a) => ({
        ...a.restaurant,
        permissions: a.permissions,
        isPrimary: a.isPrimary,
      })),
      pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
    }
  }

  throw createError({
    statusCode: 403,
    statusMessage: "Forbidden: You do not have restaurant management privileges",
  })
})
