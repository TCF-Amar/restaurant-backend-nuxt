import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Global & Admin Categories"],
    summary: "Update category by ID",
    description: "Update category name, description, image, or convert between global and outlet-specific scope.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Category ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              imageUrl: { type: "string", nullable: true },
              restaurantId: { type: "string", nullable: true },
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

const adminUpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  restaurantId: z.string().nullable().optional(), // Can convert between global (null) and outlet-specific
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)

  const categoryId = getRouterParam(event, "id")
  if (!categoryId) {
    throw createError({ statusCode: 400, statusMessage: "Category ID is required" })
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" })
  }

  if (auth.role !== "ADMIN") {
    if (!existing.restaurantId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Global platform categories can only be modified by administrators",
      })
    }
    await requireRestaurantAccess(event, existing.restaurantId, "MANAGE_CATEGORIES")
  }

  const body = await readBody(event)
  const parsed = adminUpdateCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid input",
    })
  }

  // Non-admins cannot reassign category to a different restaurant or make it global
  const targetRestaurantId = auth.role === "ADMIN" ? parsed.data.restaurantId : existing.restaurantId

  // If changing restaurantId to a specific restaurant, verify restaurant exists
  if (auth.role === "ADMIN" && parsed.data.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parsed.data.restaurantId },
    })
    if (!restaurant) {
      throw createError({ statusCode: 404, statusMessage: "Target restaurant not found" })
    }
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
      ...(parsed.data.restaurantId !== undefined ? { restaurantId: parsed.data.restaurantId } : {}),
    },
    include: {
      restaurant: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { menuItems: true },
      },
    },
  })

  return {
    status: "ok",
    category: updated,
  }
})
