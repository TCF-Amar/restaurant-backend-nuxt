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
