defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "Revoke restaurant staff assignment",
    description: "Remove all staff assignments and permissions for a user from a specific restaurant. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
      { name: "restaurantId", in: "query", required: true, schema: { type: "string" }, description: "Restaurant ID" },
    ],
    responses: {
      200: { description: "Staff assignment revoked successfully" },
      400: { description: "Missing required parameters" },
      403: { description: "Forbidden" },
    },
  },
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const userId = getRouterParam(event, "id")
  const query = getQuery(event)
  const restaurantId = String(query.restaurantId || "")

  if (!userId || !restaurantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Both User ID and Restaurant ID are required",
    })
  }

  await prisma.restaurantStaff.deleteMany({
    where: {
      userId,
      restaurantId,
    },
  })

  return {
    status: "ok",
    message: "Restaurant staff assignment revoked successfully",
  }
})
