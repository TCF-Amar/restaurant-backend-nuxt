import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Passkeys & WebAuthn"],
    summary: "Generate passkey authentication options",
    description: "Request WebAuthn assertion challenge options for passwordless biometric / security key login.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Email or phone (optional for discoverable passkey)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "WebAuthn assertion options and challenge" },
    },
  },
})

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
