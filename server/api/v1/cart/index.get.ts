import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { calculateCartPricing } from "../../../utils/cart/pricing"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Get current user cart & charges breakdown",
    description: "Fetch all items in the user's active shopping cart with live price calculations, subtotal, delivery fee, taxes, packaging fee, and grand total.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User cart summary",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                cart: { type: "object", nullable: true },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  const cart = await prisma.cart.findUnique({
    where: { userId: claims.sub },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isActive: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!cart || !cart.restaurantId || cart.items.length === 0) {
    return {
      status: "ok",
      cart: null,
      message: "Cart is empty",
    }
  }

  // Calculate live pricing & fees
  const pricing = await calculateCartPricing(
    cart.restaurantId,
    cart.items.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      variantId: i.variantId,
      addonIds: i.addonIds,
      notes: i.notes,
    }))
  )

  // Map calculated items to match cartItem IDs
  const itemsWithIds = pricing.items.map((item, idx) => ({
    ...item,
    id: cart.items[idx]?.id,
  }))

  return {
    status: "ok",
    cart: {
      id: cart.id,
      restaurant: {
        ...cart.restaurant,
        ...pricing.restaurant,
      },
      currency: pricing.currency,
      items: itemsWithIds,
      itemCount: itemsWithIds.reduce((sum, item) => sum + item.quantity, 0),
      charges: pricing.charges,
      updatedAt: cart.updatedAt,
    },
  }
})
