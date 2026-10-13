import z from "zod"


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
