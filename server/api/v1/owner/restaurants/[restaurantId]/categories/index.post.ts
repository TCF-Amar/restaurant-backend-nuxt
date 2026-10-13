import z from "zod"


const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isGlobal: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  // Permission check: requires MANAGE_CATEGORIES
  const { isSuperAdmin } = await requireRestaurantAccess(event, restaurantId, "MANAGE_CATEGORIES")

  const body = await readBody(event)
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid input",
    })
  }

  const shouldBeGlobal = parsed.data.isGlobal && isSuperAdmin

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
      restaurantId: shouldBeGlobal ? null : restaurantId,
    },
  })

  return {
    status: "ok",
    category,
  }
})
