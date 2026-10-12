import z from "zod"
import bcrypt from "bcryptjs"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Reset Password",
    description: "Submit new password using the verified one-time reset token",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["resetToken", "newPassword", "confirmPassword"],
            properties: {
              resetToken: {
                type: "string",
                description: "Single-use reset token from verify-reset-code step",
                example: "a3f5c789e...",
              },
              newPassword: {
                type: "string",
                description: "New password (minimum 8 characters)",
                example: "NewStrongSecret123!",
              },
              confirmPassword: {
                type: "string",
                description: "Must match newPassword exactly",
                example: "NewStrongSecret123!",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password reset successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: {
                  type: "string",
                  example: "Password reset successfully. Please log in with your new password.",
                },
              },
            },
          },
        },
      },
      400: { description: "Invalid/expired token or password mismatch" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z
    .object({
      resetToken: z.string().min(10, "Valid reset token is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters long"),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })

  const { resetToken, newPassword } = schema.parse(body)

  // 1. Validate and consume single-use reset token in Redis
  const userId = await consumePasswordResetToken(resetToken)
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid or expired reset token. Please request a new code.",
    })
  }

  // 2. Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User account not found",
    })
  }

  // 3. Prevent setting the same password if user had one
  if (user.password) {
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "New password cannot be the same as your previous password",
      })
    }
  }

  // 4. Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  // 5. Security best practice: Revoke ALL existing active sessions for this account
  await revokeAllUserSessions(user.id)
  clearAuthCookies(event)

  console.info(`[Auth:Reset] Password reset complete for user ${user.id}. All active sessions invalidated.`)

  return {
    status: "ok",
    message: "Password reset successfully. Please log in with your new password.",
  }
})
