import z from "zod"

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const { rpID } = getWebAuthnConfig(event)

  const schema = z.object({
    identifier: z.string().optional(),
    email: z.string().optional(),
  })

  const { identifier, email } = schema.parse(body || {})
  const loginId = (identifier || email)?.trim()

  let allowCredentials: any[] | undefined

  if (loginId) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginId }, { phone: loginId }],
      },
      include: {
        passkeys: {
          select: {
            credentialId: true,
            transports: true,
          },
        },
      },
    })

    if (user && user.passkeys.length > 0) {
      allowCredentials = user.passkeys.map((pk) => ({
        id: pk.credentialId,
        transports: pk.transports as any,
      }))
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  })

  // Store challenge in Redis for verification
  await redis.setex(`webauthn:auth-challenge:${options.challenge}`, 300, options.challenge)

  return options
})
