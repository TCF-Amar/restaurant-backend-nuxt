import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "Change user role",
    description: "Promote or demote user role (CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER). Admin role cannot be changed and Admin role cannot be assigned to any user. Requires Admin role.",
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
                enum: ["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PARTNER"],
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "User role updated successfully" },
      400: { description: "Invalid role or parameter" },
      403: { description: "Forbidden - Admin role is not changeable or Admin role cannot be assigned" },
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

  // Restriction 1: Admin cannot assign any user the ADMIN role
  if (parsed.data.role === "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Admins cannot assign the Admin role to any user",
    })
  }

  // Find target user to verify existence and check current role
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true },
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  // Restriction 2: Admin role is not changeable
  if (targetUser.role === "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin role is not changeable and cannot be modified",
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
