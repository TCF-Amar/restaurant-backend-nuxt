import z from "zod"
import type { Prisma } from "@prisma/client"

defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "List platform users",
    description: "Search and filter all registered platform users by role (CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER, ADMIN) or keyword. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, email, or phone" },
      { name: "role", in: "query", schema: { type: "string" }, description: "Filter by UserRole or ALL" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
      { name: "all", in: "query", schema: { type: "boolean" } },
    ],
    responses: {
      200: { description: "Users list and pagination metadata" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Requires Admin role" },
    },
  },
})

export default defineEventHandler(async (event) => {
  // STRICT CHECK: Only ADMIN can manage users. Restaurant owners will get 403.
  requireAdmin(event)

  const query = getQuery(event)
  const roleFilter = query.role ? String(query.role) : undefined
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"

  const where: Prisma.UserWhereInput = {
    ...(roleFilter && roleFilter !== "ALL" ? { role: roleFilter as any } : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
      : {}),
  }

  const { page, limit, skip } = getPaginationParams(event, 10)

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      ...(returnAll ? {} : { skip, take: limit }),
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        restaurantStaff: {
          select: {
            restaurantId: true,
            permissions: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    status: "ok",
    users,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
  }
})
