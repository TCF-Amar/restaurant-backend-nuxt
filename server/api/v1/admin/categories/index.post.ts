import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Global & Admin Categories"],
    summary: "Create category (Global or Restaurant)",
    description: "Create category entity. Omit restaurantId for platform-wide Global categories (Admin only), or specify restaurantId for outlet-specific categories.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "Artisan Breads" },
              description: { type: "string" },
              imageUrl: { type: "string" },
              restaurantId: { type: "string", nullable: true, description: "Omit or pass null for Global" },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Category created successfully" },
      400: { description: "Validation error" },
      403: { description: "Forbidden" },
    },
  },
})

const adminCreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  restaurantId: z.string().nullable().optional(), // null or omitted for GLOBAL
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)

  const body = await readBody(event)
  const parsed = adminCreateCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid input",
    })
  }

  if (auth.role !== "ADMIN") {
    if (!parsed.data.restaurantId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Global platform categories can only be created by administrators",
      })
    }
    await requireRestaurantAccess(event, parsed.data.restaurantId, "MANAGE_CATEGORIES")
  } else {
    // If restaurantId is supplied, verify it exists
    if (parsed.data.restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parsed.data.restaurantId },
      })
      if (!restaurant) {
        throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })
      }
    }
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      restaurantId: parsed.data.restaurantId || null,
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
    category,
  }
})
