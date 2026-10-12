import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Verify Password Reset Code",
    description: "Verify the received OTP and exchange it for a short-lived single-use password reset token",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["identifier", "code"],
            properties: {
              identifier: {
                type: "string",
                example: "user@example.com",
              },
              code: {
                type: "string",
                example: "123456",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Code verified; reset token issued",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                resetToken: {
                  type: "string",
                  example: "a3f5c789e...",
                },
                expiresInMinutes: { type: "number", example: 10 },
              },
            },
          },
        },
      },
      400: { description: "Invalid or expired verification code" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    identifier: z.string().min(3),
    code: z.string().min(4).max(8),
  })

  const { identifier, code } = schema.parse(body)
  const normalizedIdentifier = identifier.trim().toLowerCase()

  // 1. Verify and consume OTP in Redis
  const isValid = await verifyAndConsumeOtp(normalizedIdentifier, code)
  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid or expired verification code",
    })
  }

  // 2. Fetch associated user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
    },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Account not found",
    })
  }

  // 3. Issue single-use reset token valid for 10 minutes
  const resetToken = await createPasswordResetToken(user.id)

  return {
    status: "ok",
    resetToken,
    expiresInMinutes: 10,
    message: "Code verified. Please set your new password using this reset token.",
  }
})
