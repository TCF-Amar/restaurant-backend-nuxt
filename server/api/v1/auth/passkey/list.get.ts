defineRouteMeta({
  openAPI: {
    tags: ["Passkeys & WebAuthn"],
    summary: "List registered passkeys",
    description: "Fetch registered FIDO2 / WebAuthn passkey credentials for the authenticated account.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Passkeys list retrieved successfully" },
      401: { description: "Unauthorized" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)

  const passkeys = await prisma.passkey.findMany({
    where: { userId: claims.sub },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { twoFactorEnabled: true },
  })

  return {
    status: "ok",
    passkeys,
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
  }
})
