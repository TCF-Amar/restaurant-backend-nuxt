export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)

  if (auth.role !== "ADMIN") {
    if (auth.role !== "RESTAURANT_OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Forbidden: Insufficient role privileges" })
    }
    const hasPerm = await prisma.restaurantStaff.findFirst({
      where: {
        userId: auth.sub,
        permissions: { has: "MANAGE_CATEGORIES" },
      },
    })
    if (!hasPerm) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden: You do not have permission to manage categories" })
    }
  }

  const query = getQuery(event)
  const filter = query.filter ? String(query.filter) : "ALL" // ALL, GLOBAL, CUSTOM
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"
  const { page, limit, skip } = getPaginationParams(event, 10)

  const conditions: any[] = []

  if (auth.role === "RESTAURANT_OWNER") {
    conditions.push({
      OR: [
        { restaurantId: null },
        { restaurant: { owners: { some: { userId: auth.sub } } } },
      ],
    })
  }

  if (filter === "GLOBAL") {
    conditions.push({ restaurantId: null })
  } else if (filter === "CUSTOM") {
    conditions.push({ restaurantId: { not: null } })
  }

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    })
  }

  const where = conditions.length > 0 ? { AND: conditions } : {}

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
      ...(returnAll ? {} : { skip, take: limit }),
      orderBy: [
        { restaurantId: "asc" }, // nulls first (global)
        { name: "asc" },
      ],
    }),
  ])

  return {
    status: "ok",
    categories,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
  }
})
