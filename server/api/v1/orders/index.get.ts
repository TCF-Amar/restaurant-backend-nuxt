import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { getPaginationParams, formatPaginationMeta } from "../../../utils/pagination"

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const query = getQuery(event)

  const { page, limit, skip } = getPaginationParams(event, 10)
  const statusFilter = query.status ? String(query.status) : undefined
  const returnAll = query.all === "true" || query.all === "1"

  // Base where clause
  let where: any = {}

  if (claims.role === "ADMIN") {
    // Admin can see any orders, optionally filter by restaurantId, userId, status
    if (query.restaurantId) where.restaurantId = String(query.restaurantId)
    if (query.userId) where.userId = String(query.userId)
  } else if (claims.role === "RESTAURANT_OWNER" && query.restaurantId) {
    // Owner viewing orders for their restaurant
    where.restaurantId = String(query.restaurantId)
  } else {
    // Customer (or owner viewing their own customer orders)
    where.userId = claims.sub
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logoUrl: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      ...(returnAll ? {} : { skip, take: limit }),
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    status: "ok",
    orders,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
  }
})
