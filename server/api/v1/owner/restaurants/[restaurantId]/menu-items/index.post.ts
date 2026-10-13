import z from "zod"


const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  price: z.number().positive("Variant price must be positive"),
})

const addonSchema = z.object({
  name: z.string().min(1, "Addon name is required"),
  price: z.number().min(0, "Addon price cannot be negative"),
})

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().optional().default(true),
  variants: z.array(variantSchema).optional().default([]),
  addons: z.array(addonSchema).optional().default([]),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  // Permission check: requires MANAGE_MENU_ITEMS
  await requireRestaurantAccess(event, restaurantId, "MANAGE_MENU_ITEMS")

  const body = await readBody(event)
  const parsed = createMenuItemSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid input",
    })
  }

  // Ensure category either belongs to this restaurant OR is a global platform category
  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      OR: [
        { restaurantId },
        { restaurantId: null },
      ],
    },
  })
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: "Selected category does not exist or is not available for this restaurant" })
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      categoryId: parsed.data.categoryId,
      restaurantId,
      imageUrl: parsed.data.imageUrl || null,
      isAvailable: parsed.data.isAvailable,
      variants: parsed.data.variants && parsed.data.variants.length > 0 ? {
        create: parsed.data.variants.map((v) => ({ name: v.name, price: v.price })),
      } : undefined,
      addons: parsed.data.addons && parsed.data.addons.length > 0 ? {
        create: parsed.data.addons.map((a) => ({ name: a.name, price: a.price })),
      } : undefined,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      variants: {
        orderBy: { price: "asc" },
      },
      addons: {
        orderBy: { price: "asc" },
      },
    },
  })

  return {
    status: "ok",
    menuItem,
  }
})
