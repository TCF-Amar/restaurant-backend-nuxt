import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Add or increment item in shopping cart",
    description: "Add a dish to the user cart with selected variant, addons, and notes. Enforces single-restaurant policy (returns 409 if adding from another restaurant without forceReset).",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["restaurantId", "menuItemId"],
            properties: {
              restaurantId: { type: "string" },
              menuItemId: { type: "string" },
              quantity: { type: "integer", default: 1 },
              variantId: { type: "string", nullable: true },
              addonIds: { type: "array", items: { type: "string" } },
              notes: { type: "string", nullable: true },
              forceReset: { type: "boolean", default: false, description: "Clear existing cart if from different restaurant" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Item added to cart successfully" },
      400: { description: "Invalid menu item or unavailable" },
      409: { description: "Cart contains items from another restaurant" },
    },
  },
})

const addItemSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  menuItemId: z.string().min(1, "menuItemId is required"),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  variantId: z.string().optional().nullable(),
  addonIds: z.array(z.string()).optional().nullable().default([]),
  notes: z.string().optional().nullable(),
  forceReset: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = addItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid cart item parameters",
    })
  }

  const { restaurantId, menuItemId, quantity, variantId, addonIds, notes, forceReset } = parsed.data

  // Validate menu item exists, belongs to restaurant, and is available
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      restaurantId,
    },
    include: {
      restaurant: {
        select: { id: true, name: true, isActive: true },
      },
      variants: true,
      addons: true,
    },
  })

  if (!menuItem) {
    throw createError({
      statusCode: 404,
      statusMessage: "Menu item not found in this restaurant",
    })
  }

  if (!menuItem.restaurant.isActive) {
    throw createError({
      statusCode: 400,
      statusMessage: "This restaurant is currently closed",
    })
  }

  if (!menuItem.isAvailable) {
    throw createError({
      statusCode: 400,
      statusMessage: "This item is currently sold out",
    })
  }

  // Validate variant if provided
  if (variantId && variantId.trim() !== "") {
    const exists = menuItem.variants.some((v) => v.id === variantId)
    if (!exists) {
      throw createError({ statusCode: 400, statusMessage: "Selected variant is invalid for this item" })
    }
  }

  // Get or initialize user's cart
  let cart = await prisma.cart.findUnique({
    where: { userId: claims.sub },
    include: {
      items: true,
      restaurant: { select: { id: true, name: true } },
    },
  })

  // Check multi-restaurant conflict
  if (cart && cart.restaurantId && cart.restaurantId !== restaurantId && cart.items.length > 0) {
    if (!forceReset) {
      throw createError({
        statusCode: 409,
        statusMessage: `Your cart contains items from "${cart.restaurant?.name || "another restaurant"}". Clear cart and add this item?`,
        data: {
          requiresReset: true,
          currentRestaurantId: cart.restaurantId,
          currentRestaurantName: cart.restaurant?.name,
          newRestaurantId: restaurantId,
        },
      })
    }

    // Force reset: wipe items and update restaurantId
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.update({
      where: { id: cart.id },
      data: { restaurantId },
    })
  }

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: claims.sub,
        restaurantId,
      },
      include: { items: true, restaurant: true },
    })
  } else if (!cart.restaurantId) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { restaurantId },
    })
  }

  const cleanAddons = Array.isArray(addonIds) ? [...addonIds].sort() : []
  const cleanVariant = variantId?.trim() || null

  // Check if identical item already exists in cart (same menuItemId, variant, and addons)
  const existingItem = cart.items.find((item) => {
    if (item.menuItemId !== menuItemId) return false
    if ((item.variantId || null) !== cleanVariant) return false
    const itemAddons = [...(item.addonIds || [])].sort()
    return JSON.stringify(itemAddons) === JSON.stringify(cleanAddons)
  })

  let cartItem
  if (existingItem) {
    // Increment quantity
    cartItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: Math.min(99, existingItem.quantity + quantity),
        notes: notes !== undefined ? notes : existingItem.notes,
      },
    })
  } else {
    // Create new cart item
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId,
        quantity,
        variantId: cleanVariant,
        addonIds: cleanAddons,
        notes: notes || null,
      },
    })
  }

  return {
    status: "ok",
    message: "Item added to cart",
    cartItem,
  }
})
