import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Two-Factor Authentication (2FA)"],
    summary: "Verify & enable 2FA",
    description: "Confirm TOTP setup by providing the 6-digit verification code from your authenticator app. Saves secret and marks 2FA as active.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["code"],
            properties: {
              code: { type: "string", example: "123456", description: "6-digit TOTP code" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Two-factor authentication enabled successfully" },
      400: { description: "Invalid code or setup session expired" },
      401: { description: "Unauthorized" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const body = await readBody(event)

  const schema = z.object({
    code: z.string().min(6).max(8),
  })

  const { code } = schema.parse(body)

  // Retrieve pending secret from Redis
  const pendingSecret = await redis.get(`totp:setup:${claims.sub}`)
  if (!pendingSecret) {
    throw createError({
      statusCode: 400,
      statusMessage: "Setup session expired or not initiated. Please generate a new QR code.",
    })
  }

  // Validate the code with the pending secret
  const isValid = verifyTotpToken(pendingSecret, code)
  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid verification code. Please check your authenticator app and try again.",
    })
  }

  // Save the 2FA secret and activate 2FA for the user
  await prisma.user.update({
    where: { id: claims.sub },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: pendingSecret,
    },
  })

  // Clean up setup key from Redis
  await redis.del(`totp:setup:${claims.sub}`)

  return {
    status: "ok",
    message: "Two-factor authentication (Authenticator App) has been enabled successfully.",
  }
})
