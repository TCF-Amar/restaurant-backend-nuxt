import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Forgot Password (Request OTP)",
    description: "Send a password reset verification code to an email or phone number",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["identifier"],
            properties: {
              identifier: {
                type: "string",
                description: "Registered email address or phone number",
                example: "user@example.com",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password reset OTP dispatched",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: {
                  type: "string",
                  example: "If an account exists, a verification code has been sent",
                },
                cooldownSeconds: { type: "number", example: 60 },
              },
            },
          },
        },
      },
      429: { description: "Cooldown active" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    identifier: z.string().min(3),
  })

  const { identifier } = schema.parse(body)
  const normalizedIdentifier = identifier.trim().toLowerCase()

  // 1. Check rate limit / resend cooldown in Redis
  const remainingCooldown = await checkOtpCooldown(normalizedIdentifier)
  if (remainingCooldown) {
    throw createError({
      statusCode: 429,
      statusMessage: `Please wait ${remainingCooldown}s before requesting a new code`,
    })
  }

  // 2. Check if user exists in database
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
    },
    select: { id: true, email: true, phone: true },
  })

  // Prevent email/phone enumeration:
  // If user does not exist, return success response without sending email
  if (user) {
    const otp = generateNumericOtp(6)
    await saveOtp(normalizedIdentifier, otp)

    const isEmail = normalizedIdentifier.includes("@")
    if (isEmail) {
      await sendOtpEmailJob(normalizedIdentifier, otp, 5)
    } else {
      await sendOtpSmsJob(identifier.trim(), otp)
    }

    console.info(`[Auth:Forgot] Dispatched reset OTP to ${normalizedIdentifier}`)
  } else {
    console.warn(`[Auth:Forgot] Identifier not registered: ${normalizedIdentifier}`)
  }

  return {
    status: "ok",
    message: "If an account exists with this identifier, a verification code has been sent",
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  }
})
