import z from "zod"
import bcrypt from "bcryptjs"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Change Password",
    description: "Update current password for the authenticated user and revoke other active sessions",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["newPassword", "confirmPassword"],
            properties: {
              currentPassword: {
                type: "string",
                description: "Existing account password (optional only if user registered via Google/OAuth without password)",
                example: "OldSecret123!",
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
        description: "Password changed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string", example: "Password changed successfully" },
              },
            },
          },
        },
      },
      400: { description: "Invalid password or passwords do not match" },
      401: { description: "Unauthorized" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const body = await readBody(event)

  const schema = z
    .object({
      currentPassword: z.string().optional(),
      otpCode: z.string().optional(),
      newPassword: z.string().min(8, "New password must be at least 8 characters long"),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .refine((data) => !!data.currentPassword || !!data.otpCode, {
      message: "Either current password or verification code (OTP) is required",
      path: ["currentPassword"],
    })

  const { currentPassword, otpCode, newPassword } = schema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, phone: true, password: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    })
  }

  // 1. Prevent reusing current password if user already has one (checked before OTP/credentials are consumed)
  if (user.password) {
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "New password cannot be the same as current password",
      })
    }
  }

  // 2. If OTP provided, verify and consume OTP
  if (otpCode) {
    const identifier = (user.email || user.phone || "").trim().toLowerCase()
    if (!identifier) {
      throw createError({
        statusCode: 400,
        statusMessage: "No registered email or phone found to verify code",
      })
    }

    const isOtpValid = await verifyAndConsumeOtp(identifier, otpCode.trim())
    if (!isOtpValid) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid or expired verification code",
      })
    }
  } else if (user.password) {
    // 3. Otherwise verify current password
    if (!currentPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "Current password is required",
      })
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentValid) {
      throw createError({
        statusCode: 400,
        statusMessage: "Incorrect current password",
      })
    }
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password in database
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  // Security requirement: Revoke ALL user sessions and clear auth cookies so user is logged out
  await revokeAllUserSessions(user.id)
  clearAuthCookies(event)

  console.info(`[Auth] User ${user.id} updated password via ${otpCode ? "OTP" : "current password"}. All sessions revoked.`)

  return {
    status: "ok",
    message: "Password changed successfully. Please log in with your new password.",
  }
})
