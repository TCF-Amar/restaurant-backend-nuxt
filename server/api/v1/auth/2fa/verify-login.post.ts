import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Two-Factor Authentication (2FA)"],
    summary: "Complete login with 2FA code",
    description: "Exchange a temporary login token and 6-digit TOTP code for full access and refresh JWT tokens.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["tempToken", "code"],
            properties: {
              tempToken: { type: "string", description: "Temporary token issued during stage 1 login" },
              code: { type: "string", example: "123456", description: "6-digit TOTP code" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "2FA login verification successful" },
      400: { description: "Invalid code or expired session" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    tempToken: z.string().min(1),
    code: z.string().min(6).max(8),
  })

  const { tempToken, code } = schema.parse(body)

  // Retrieve cached login state from Redis
  const cachedData = await redis.get(`totp:login-temp:${tempToken}`)
  if (!cachedData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Two-factor session expired or invalid. Please log in again.",
    })
  }

  const { userId } = JSON.parse(cachedData)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid authentication request.",
    })
  }

  if (user.isSuspended) {
    throw createError({
      statusCode: 403,
      statusMessage: "Your account has been suspended by an administrator.",
    })
  }

  // Verify TOTP code
  const isValid = verifyTotpToken(user.twoFactorSecret, code)
  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid authenticator code. Please check your app and try again.",
    })
  }

  // Clean up temporary token
  await redis.del(`totp:login-temp:${tempToken}`)

  // Create session and issue tokens
  const { accessToken, refreshToken } = await createSession(event, user)

  return {
    status: "ok",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  }
})
