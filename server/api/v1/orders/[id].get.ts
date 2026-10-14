import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Orders & Checkout"],
    summary: "Get order details",
    description: "Fetch comprehensive single order breakdown, including item options, addons, pricing snapshot, customer, and delivery destination.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID" },
    ],
    responses: {
      200: {
        description: "Order details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                order: { type: "object" },
              },
            },
          },
        },
      },
      403: { description: "Forbidden" },
      404: { description: "Order not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required" })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          logoUrl: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" })
  }

  // Authorization check: Customer can only view their own order; Owners can view orders for their restaurant; Admins can view any
  if (claims.role !== "ADMIN" && order.userId !== claims.sub) {
    const isOwner = await prisma.restaurant.findFirst({
      where: { id: order.restaurantId, ownerId: claims.sub },
    })
    if (!isOwner) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden: You cannot access this order" })
    }
  }

  return {
    status: "ok",
    order,
  }
})
