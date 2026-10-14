

defineRouteMeta({
  openAPI: {
    tags: ["Owner Orders"],
    summary: "List restaurant orders",
    description: "Fetch paginated live orders specifically for this restaurant outlet. Requires MANAGE_ORDERS permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
      { name: "all", in: "query", schema: { type: "boolean" } },
    ],
    responses: {
      200: { description: "Orders list" },
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

  // Permission check: requires MANAGE_ORDERS
  await requireRestaurantAccess(event, restaurantId, "MANAGE_ORDERS")

  const query = getQuery(event)
  const statusFilter = query.status ? String(query.status) : undefined
  const returnAll = query.all === "true" || query.all === "1"
  const { page, limit, skip } = getPaginationParams(event, 10)

  const where = {
    restaurantId,
    ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
