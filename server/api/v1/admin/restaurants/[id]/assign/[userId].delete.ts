

defineRouteMeta({
  openAPI: {
    tags: ["Admin Restaurant Management"],
    summary: "Unassign staff from restaurant",
    description: "Remove user from restaurant staff list. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Restaurant ID" },
      { name: "userId", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
    ],
    responses: {
      200: { description: "User unassigned successfully" },
      400: { description: "Missing required parameters" },
      403: { description: "Forbidden" },
    },
  },
})

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can unassign owners
  requireAdmin(event)

  const restaurantId = getRouterParam(event, "id")
  const userId = getRouterParam(event, "userId")

  if (!restaurantId || !userId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID and User ID are required" })
  }

  await prisma.restaurantStaff.delete({
    where: {
      userId_restaurantId: {
        userId,
        restaurantId,
      },
    },
  })

  return {
    status: "ok",
    message: "User unassigned from restaurant successfully",
  }
})
