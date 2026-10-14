import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "Suspend or reactivate user account",
    description: "Toggle account suspension status. If suspended, user active sessions and refresh tokens are immediately revoked.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              isSuspended: { type: "boolean", description: "Set explicitly or omit to toggle" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "User suspension status updated" },
      400: { description: "Cannot suspend own admin account" },
      403: { description: "Forbidden" },
      404: { description: "User not found" },
    },
  },
})

const suspendSchema = z.object({
  isSuspended: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const userId = getRouterParam(event, "id")
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  // Prevent admin from suspending themselves
  if (admin.sub === userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "You cannot suspend your own admin account",
    })
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, isSuspended: true, role: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  let targetStatus: boolean
  try {
    const body = await readBody(event)
    const parsed = suspendSchema.safeParse(body || {})
    if (parsed.success && parsed.data.isSuspended !== undefined) {
      targetStatus = parsed.data.isSuspended
    } else {
      targetStatus = !existing.isSuspended
    }
  } catch {
    targetStatus = !existing.isSuspended
  }

  // Update user suspension status
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: targetStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuspended: true,
    },
  })

  // If suspended, invalidate all active user sessions immediately
  if (targetStatus) {
    await prisma.session.deleteMany({
      where: { userId },
    })
  }

  return {
    status: "ok",
    message: `User ${updated.name} has been ${updated.isSuspended ? "suspended" : "reactivated"}`,
    user: updated,
  }
})
