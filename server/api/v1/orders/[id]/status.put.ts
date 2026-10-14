import { z } from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Orders & Checkout"],
    summary: "Update order status",
    description: "Update fulfillment status of an order in the kitchen pipeline (ACCEPTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED). Requires Admin or Restaurant Staff access.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["status"],
            properties: {
              status: {
                type: "string",
                enum: [
                  "PENDING",
                  "ACCEPTED",
                  "PREPARING",
                  "READY_FOR_PICKUP",
                  "OUT_FOR_DELIVERY",
                  "DELIVERED",
                  "CANCELLED",
                ],
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Order status updated successfully" },
      400: { description: "Invalid order status provided" },
      403: { description: "Forbidden" },
      404: { description: "Order not found" },
    },
  },
})

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required" })
  }

  const body = await readBody(event)
  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid order status provided" })
  }

  const order = await prisma.order.findUnique({
    where: { id },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" })
  }

  // Authorization check: User must be ADMIN or owner/staff of the restaurant
  if (claims.role !== "ADMIN") {
    const isOwnerOrStaff = await prisma.restaurant.findFirst({
      where: {
        id: order.restaurantId,
        OR: [
          { ownerId: claims.sub },
          {
            staff: {
              some: {
                userId: claims.sub,
                permissions: { has: "MANAGE_ORDERS" },
              },
            },
          },
        ],
      },
    })

    if (!isOwnerOrStaff) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden: You cannot modify this order" })
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
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
            },
          },
        },
      },
    },
  })

  return {
    status: "ok",
    order: updated,
  }
})
