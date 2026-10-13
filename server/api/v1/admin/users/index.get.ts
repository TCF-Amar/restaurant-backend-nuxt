import z from "zod"


export default defineEventHandler(async (event) => {
  // STRICT CHECK: Only ADMIN can manage users. Restaurant owners will get 403.
  requireAdmin(event)

  const query = getQuery(event)
  const roleFilter = query.role ? String(query.role) : undefined
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"

  const where = {
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
