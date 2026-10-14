import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "Change user role",
    description: "Promote or demote user role (CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER, ADMIN). Requires Admin role.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["role"],
            properties: {
              role: {
                type: "string",
                enum: ["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PARTNER", "ADMIN"],
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "User role updated successfully" },
      400: { description: "Invalid role or parameter" },
      403: { description: "Forbidden" },
      404: { description: "User not found" },
    },
  },
})


const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PARTNER", "ADMIN"]),
})

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can change user roles
  requireAdmin(event)

  const userId = getRouterParam(event, "id")
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  const body = await readBody(event)
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation error: Invalid role provided",
    })
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return {
    status: "ok",
    user: updatedUser,
  }
})
