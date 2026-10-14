import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Delete item from cart",
    description: "Remove a single food item from the user's shopping cart.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Cart Item ID" },
    ],
    responses: {
      200: { description: "Item removed from cart" },
      404: { description: "Cart item not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")

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

  await prisma.cartItem.delete({ where: { id } })

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
  }
})
