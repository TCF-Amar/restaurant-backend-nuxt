import z from "zod"


const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  const categoryId = getRouterParam(event, "categoryId")

  if (!restaurantId || !categoryId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid parameters" })
  }

  const { isSuperAdmin } = await requireRestaurantAccess(event, restaurantId, "MANAGE_CATEGORIES")

  const body = await readBody(event)
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid data" })
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" })
  }

  // If global category, only Admin can edit it
  if (existing.restaurantId === null && !isSuperAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Global platform categories can only be modified by administrators" })
  }

  // If owned by another restaurant and caller is not Admin
  if (existing.restaurantId !== null && existing.restaurantId !== restaurantId && !isSuperAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Category does not belong to this restaurant" })
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
    },
  })

  return {
    status: "ok",
    category: updated,
  }
})
