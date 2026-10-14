defineRouteMeta({
  openAPI: {
    tags: ["Two-Factor Authentication (2FA)"],
    summary: "Initialize 2FA authenticator setup",
    description: "Generate a TOTP secret and QR code for scanning in Google Authenticator or 1Password. Caches temporary setup key in Redis for 10 minutes.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "TOTP secret and QR code generated successfully" },
      401: { description: "Unauthorized" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, name: true, twoFactorEnabled: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  const { secret, uri, qrCode } = await generateTotpSetup(user.email || user.name || "User")

  // Cache pending secret in Redis for 10 minutes awaiting confirmation
  await redis.setex(`totp:setup:${user.id}`, 600, secret)

  return {
    status: "ok",
    secret,
    qrCode,
    uri,
    alreadyEnabled: user.twoFactorEnabled,
    message: "Scan the QR code with Google Authenticator or your authenticator app, then enter the 6-digit code to confirm.",
  }
})
