import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { getPaginationParams, formatPaginationMeta } from "../../../utils/pagination"

defineRouteMeta({
  openAPI: {
    tags: ["Orders & Checkout"],
    summary: "List orders feed & history",
    description: "Fetch paginated orders. Customers receive their order history; Restaurant Owners and Admins receive store orders with status and restaurant filters.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "query", schema: { type: "string" }, description: "Filter by restaurant ID" },
      { name: "status", in: "query", schema: { type: "string" }, description: "Filter by OrderStatus (PENDING, PREPARING, DELIVERED, etc.)" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Pagination page" },
      { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page" },
      { name: "all", in: "query", schema: { type: "boolean" }, description: "Return all records without pagination" },
    ],
    responses: {
      200: {
        description: "Orders retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                orders: { type: "array" },
                pagination: { type: "object" },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
    },
  },
})

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
