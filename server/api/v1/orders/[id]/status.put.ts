import { z } from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

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
