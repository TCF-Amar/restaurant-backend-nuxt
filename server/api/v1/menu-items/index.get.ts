import type { Prisma } from "@prisma/client"
import { prisma } from "../../../utils/prisma"
import { getPaginationParams, formatPaginationMeta } from "../../../utils/pagination"

defineRouteMeta({
  openAPI: {
    tags: ["Customer Menu & Dishes (Mobile App)"],
    summary: "Get all menu items / dishes for User App",
    description: "Public endpoint for the Flutter mobile app and web customers to fetch active food items and dishes with variants and addons. Filterable by restaurantId, categoryId, or keyword search.",
    parameters: [
      { name: "restaurantId", in: "query", schema: { type: "string" }, description: "Filter dishes by restaurant outlet ID" },
      { name: "categoryId", in: "query", schema: { type: "string" }, description: "Filter dishes by category ID" },
      { name: "search", in: "query", schema: { type: "string" }, description: "Search by dish name or description" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
      { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
      { name: "all", in: "query", schema: { type: "boolean" }, description: "Return all items without pagination" },
    ],
    responses: {
      200: {
        description: "List of dishes available for ordering",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                items: { type: "array" },
                pagination: { type: "object" },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const restaurantId = query.restaurantId ? String(query.restaurantId) : undefined
  const categoryId = query.categoryId && query.categoryId !== "ALL" ? String(query.categoryId) : undefined
  const search = query.search ? String(query.search).trim() : undefined
  const returnAll = query.all === "true" || query.all === "1"
  const { page, limit, skip } = getPaginationParams(event, 20)

  const where: Prisma.MenuItemWhereInput = {
    isAvailable: true,
    restaurant: {
      isActive: true,
    },
    ...(restaurantId ? { restaurantId } : {}),
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

  const [total, items] = await Promise.all([
    prisma.menuItem.count({ where }),
    prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            logoUrl: true,
            isActive: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
          },
          orderBy: { price: "asc" },
        },
        addons: {
          select: {
            id: true,
            name: true,
            price: true,
          },
          orderBy: { price: "asc" },
        },
      },
      ...(returnAll ? {} : { skip, take: limit }),
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    status: "ok",
    items,
    pagination: formatPaginationMeta(total, returnAll ? 1 : page, returnAll ? total : limit),
  }
})
