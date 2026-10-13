import z from "zod"

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
