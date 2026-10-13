export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const { rpName, rpID } = getWebAuthnConfig(event)

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: {
      passkeys: {
        select: {
          credentialId: true,
          transports: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  const existingCredentials = user.passkeys.map((pk) => ({
    id: pk.credentialId,
    transports: pk.transports as any,
  }))

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email || user.phone || user.name,
    userDisplayName: user.name || "User",
    attestationType: "none",
    excludeCredentials: existingCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  })

  // Save registration challenge in Redis with 5 minute expiration
  await redis.setex(`webauthn:reg:${user.id}`, 300, options.challenge)

  return options
})
