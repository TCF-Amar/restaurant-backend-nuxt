import { z } from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Update cart item quantity",
    description: "Update the quantity or special instructions for an item in the cart. If quantity is set to 0, item is removed from the cart.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Cart Item ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["quantity"],
            properties: {
              quantity: { type: "integer", minimum: 0, maximum: 99 },
              notes: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Cart item updated" },
      404: { description: "Cart item not found" },
    },
  },
})

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")
  const body = await readBody(event)
  const parsed = updateCartItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid update payload",
    })
  }

  const { quantity, notes } = parsed.data

  // Fetch cart item ensuring it belongs to current user
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      cart: { userId: claims.sub },
    },
    include: { cart: true },
  })

  if (!cartItem) {
    throw createError({ statusCode: 404, statusMessage: "Cart item not found" })
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id } })

    // If no more items in cart, clean up restaurantId
    const remainingCount = await prisma.cartItem.count({ where: { cartId: cartItem.cartId } })
    if (remainingCount === 0) {
      await prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { restaurantId: null },
      })
    }

    return {
      status: "ok",
      message: "Item removed from cart",
      removed: true,
    }
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: {
      quantity,
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return {
    status: "ok",
    message: "Cart item updated",
    cartItem: updated,
  }
})
