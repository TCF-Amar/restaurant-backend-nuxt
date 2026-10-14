import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Clear shopping cart",
    description: "Remove all items from the current user's shopping cart.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Cart emptied successfully" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  const cart = await prisma.cart.findUnique({
    where: { userId: claims.sub },
  })

  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.update({
      where: { id: cart.id },
      data: { restaurantId: null },
    })
  }

  return {
    status: "ok",
    message: "Cart cleared successfully",
  }
})
