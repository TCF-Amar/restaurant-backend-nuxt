import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Categories"],
    summary: "Update category",
    description: "Update restaurant category name, description, or image. Requires MANAGE_CATEGORIES permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "categoryId", in: "path", required: true, schema: { type: "string" }, description: "Category ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              imageUrl: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Category updated successfully" },
      400: { description: "Invalid parameters" },
      403: { description: "Forbidden" },
      404: { description: "Category not found" },
    },
  },
})


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
