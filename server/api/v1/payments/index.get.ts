import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { getPaginationParams, formatPaginationMeta } from "../../../utils/pagination"

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Transactions"],
    summary: "List payments and transaction ledger",
    description: "Fetch paginated payments with filtering by status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED), payment method, restaurant, or keyword. Admins see platform-wide transactions; Restaurant Owners see their outlet revenues.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "query", schema: { type: "string" }, description: "Filter by restaurant ID" },
      { name: "status", in: "query", schema: { type: "string" }, description: "Filter by PaymentStatus" },
      { name: "method", in: "query", schema: { type: "string" }, description: "Filter by PaymentMethod" },
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by transaction ID, order number, or customer name/email" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
      { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page" },
      { name: "all", in: "query", schema: { type: "boolean" }, description: "Return all records without pagination" },
    ],
    responses: {
      200: {
        description: "Payments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                payments: { type: "array" },
                pagination: { type: "object" },
                stats: { type: "object" },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  // Payment history is strictly restricted to ADMIN - Never shown to Restaurant Owners or Customers
  if (claims.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Payment history is strictly restricted to Administrators",
    })
  }

  const query = getQuery(event)

  const { page, limit, skip } = getPaginationParams(event, 10)
  const statusFilter = query.status && query.status !== "ALL" ? String(query.status) : undefined
  const methodFilter = query.method && query.method !== "ALL" ? String(query.method) : undefined
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"

  let where: any = {}

  if (query.restaurantId) {
    where.restaurantId = String(query.restaurantId)
  }

  if (statusFilter) {
    where.status = statusFilter
  }

  if (methodFilter) {
    where.method = methodFilter
  }

  if (search) {
    where.OR = [
      { transactionId: { contains: search, mode: "insensitive" } },
      { gatewayOrderId: { contains: search, mode: "insensitive" } },
      { gatewayPaymentId: { contains: search, mode: "insensitive" } },
      { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [total, payments, statsAgg] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            paymentMethod: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      ...(returnAll ? {} : { skip, take: limit }),
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: claims.role === "ADMIN" ? {} : where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ])

  // Aggregate summary statistics
  let totalVolume = 0
  let completedCount = 0
  let pendingCount = 0
  let refundedCount = 0

  for (const stat of statsAgg) {
    if (stat.status === "COMPLETED") {
      completedCount = stat._count._all
      totalVolume += Number(stat._sum.amount || 0)
    } else if (stat.status === "PENDING" || stat.status === "PROCESSING") {
      pendingCount += stat._count._all
    } else if (stat.status === "REFUNDED") {
      refundedCount += stat._count._all
    }
  }

  return {
    status: "ok",
    payments,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
    stats: {
      totalVolume: totalVolume.toFixed(2),
      completedCount,
      pendingCount,
      refundedCount,
      totalCount: total,
    },
  }
})
