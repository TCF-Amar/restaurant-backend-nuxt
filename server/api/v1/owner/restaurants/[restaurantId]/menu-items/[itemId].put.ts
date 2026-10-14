import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Restaurant Menu Items"],
    summary: "Update menu item / dish",
    description: "Update dish name, price, stock availability, category, variants, and addons. Requires MANAGE_MENU_ITEMS permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "itemId", in: "path", required: true, schema: { type: "string" }, description: "Menu Item ID" },
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
              price: { type: "number" },
              categoryId: { type: "string" },
              imageUrl: { type: "string" },
              isAvailable: { type: "boolean" },
              variants: { type: "array" },
              addons: { type: "array" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Menu item updated successfully" },
      400: { description: "Invalid parameters" },
      403: { description: "Forbidden" },
      404: { description: "Menu item not found" },
    },
  },
})


const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  price: z.number().positive("Variant price must be positive"),
})

const addonSchema = z.object({
  name: z.string().min(1, "Addon name is required"),
  price: z.number().min(0, "Addon price cannot be negative"),
})

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  addons: z.array(addonSchema).optional(),
})

export default defineEventHandler(async (event) => {
  const restaurantId = getRouterParam(event, "restaurantId")
  const itemId = getRouterParam(event, "itemId")

  if (!restaurantId || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid parameters" })
  }

  await requireRestaurantAccess(event, restaurantId, "MANAGE_MENU_ITEMS")

  const body = await readBody(event)
  const parsed = updateMenuItemSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input" })
  }

  // Ensure menu item belongs to this restaurant
  const existing = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Menu item not found in this restaurant" })
  }

  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        OR: [{ restaurantId }, { restaurantId: null }],
      },
    })
    if (!cat) {
      throw createError({ statusCode: 400, statusMessage: "Category does not exist or is not available for this restaurant" })
    }
  }

  // Handle variants update if provided
  if (parsed.data.variants !== undefined) {
    await prisma.menuItemVariant.deleteMany({ where: { menuItemId: itemId } })
    if (parsed.data.variants.length > 0) {
      await prisma.menuItemVariant.createMany({
        data: parsed.data.variants.map((v) => ({
          menuItemId: itemId,
          name: v.name,
          price: v.price,
        })),
      })
    }
  }

  // Handle addons update if provided
  if (parsed.data.addons !== undefined) {
    await prisma.menuItemAddon.deleteMany({ where: { menuItemId: itemId } })
    if (parsed.data.addons.length > 0) {
      await prisma.menuItemAddon.createMany({
        data: parsed.data.addons.map((a) => ({
          menuItemId: itemId,
          name: a.name,
          price: a.price,
        })),
      })
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl || null } : {}),
      ...(parsed.data.isAvailable !== undefined ? { isAvailable: parsed.data.isAvailable } : {}),
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
    menuItem: updated,
  }
})
