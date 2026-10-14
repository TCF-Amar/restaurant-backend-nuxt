import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Owner Orders"],
    summary: "Update restaurant order status",
    description: "Update status of an order for this restaurant. Requires MANAGE_ORDERS permission.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "restaurantId", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "orderId", in: "path", required: true, schema: { type: "string" }, description: "Order ID" },
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
      400: { description: "Invalid parameters or status" },
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
  const restaurantId = getRouterParam(event, "restaurantId")
  const orderId = getRouterParam(event, "orderId")

  if (!restaurantId || !orderId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid parameters" })
  }

  // Permission check: requires MANAGE_ORDERS
  await requireRestaurantAccess(event, restaurantId, "MANAGE_ORDERS")

  const body = await readBody(event)
  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid order status provided" })
  }

  // Ensure order belongs to this restaurant
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  })
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found in this restaurant" })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status },
  })

  return {
    status: "ok",
    order: updated,
  }
})
