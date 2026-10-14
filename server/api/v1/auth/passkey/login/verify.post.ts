import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Passkeys & WebAuthn"],
    summary: "Verify passkey assertion & authenticate",
    description: "Verify signed WebAuthn authentication assertion from client device and establish user session.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["response", "challenge"],
            properties: {
              response: { type: "object", description: "Authenticator assertion response" },
              challenge: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Authentication successful, returns tokens and user profile" },
      400: { description: "Invalid verification response or expired challenge" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { rpID, origin } = getWebAuthnConfig(event)

  const schema = z.object({
    response: z.any(),
    challenge: z.string().min(1),
  })

  const { response, challenge } = schema.parse(body)

  // Verify challenge in Redis
  const expectedChallenge = await redis.get(`webauthn:auth-challenge:${challenge}`)
  if (!expectedChallenge) {
    throw createError({
      statusCode: 400,
      statusMessage: "Authentication session expired or invalid. Please try again.",
    })
  }

  // Lookup passkey in database using credential id from response
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
    include: { user: true },
  })

  if (!passkey || !passkey.user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Passkey credential not recognized.",
    })
  }

  if (passkey.user.isSuspended) {
    throw createError({
      statusCode: 403,
      statusMessage: "Your account has been suspended by an administrator.",
    })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: Number(passkey.counter),
        transports: passkey.transports as any,
      },
      requireUserVerification: false,
    })
  } catch (err: any) {
    console.error("[Passkey:Login] Verification failed:", err)
    throw createError({
      statusCode: 400,
      statusMessage: err.message || "Passkey verification failed.",
    })
  }

  if (!verification.verified) {
    throw createError({
      statusCode: 400,
      statusMessage: "Passkey signature could not be verified.",
    })
  }

  // Update passkey counter and lastUsedAt timestamp
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  })

  // Delete challenge from Redis
  await redis.del(`webauthn:auth-challenge:${challenge}`)

  // Create session, set cookies, and issue tokens
  const { accessToken, refreshToken } = await createSession(event, passkey.user)

  return {
    status: "ok",
    accessToken,
    refreshToken,
    user: {
      id: passkey.user.id,
      name: passkey.user.name,
      email: passkey.user.email,
      phone: passkey.user.phone,
      role: passkey.user.role,
    },
  }
})
