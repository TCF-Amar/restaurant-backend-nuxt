import z from "zod"

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const body = await readBody(event)
  const { rpID, origin } = getWebAuthnConfig(event)

  const schema = z.object({
    response: z.any(),
    name: z.string().optional(),
  })

  const { response, name } = schema.parse(body)

  const expectedChallenge = await redis.get(`webauthn:reg:${claims.sub}`)
  if (!expectedChallenge) {
    throw createError({
      statusCode: 400,
      statusMessage: "Registration challenge expired or missing. Please try again.",
    })
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    })
  } catch (err: any) {
    console.error("[Passkey:Register] Verification failed:", err)
    throw createError({
      statusCode: 400,
      statusMessage: err.message || "Passkey registration verification failed.",
    })
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({
      statusCode: 400,
      statusMessage: "Passkey verification could not be validated.",
    })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  // Store passkey in database
  const passkey = await prisma.passkey.create({
    data: {
      userId: claims.sub,
      name: name?.trim() || "Passkey",
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: (credential.transports || []) as string[],
    },
  })

  // Clean up Redis challenge
  await redis.del(`webauthn:reg:${claims.sub}`)

  return {
    status: "ok",
    message: "Passkey registered successfully.",
    passkey: {
      id: passkey.id,
      name: passkey.name,
      createdAt: passkey.createdAt,
    },
  }
})
