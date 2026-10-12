import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Verify OTP & Login",
    description: "Verify one-time passcode for phone or email. If user exists, logs into their account; otherwise, creates a new account.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["identifier", "code"],
            properties: {
              identifier: {
                type: "string",
                description: "Email address or phone number",
                example: "+919876543210 or user@example.com",
              },
              code: {
                type: "string",
                description: "6-digit OTP code",
                example: "123456",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP verification successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string", nullable: true },
                    phone: { type: "string", nullable: true },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid or expired OTP",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    identifier: z.string().min(3),
    code: z.string().length(6),
  })

  const { identifier, code } = schema.parse(body)
  const trimmedId = identifier.trim()
  const isEmail = trimmedId.includes("@")

  const isValid = await verifyAndConsumeOtp(trimmedId, code)
  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid or expired OTP code",
    })
  }

  // 1. Find existing account by email OR phone
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: trimmedId },
        { phone: trimmedId },
      ],
    },
  })

  const now = new Date()

  // 2. If user exists, update verification status
  if (user) {
    const updateData: { emailVerifiedAt?: Date; phoneVerifiedAt?: Date; phone?: string; email?: string } = {}
    if (isEmail && !user.emailVerifiedAt) {
      updateData.emailVerifiedAt = now
    }
    if (!isEmail && (!user.phoneVerifiedAt || !user.phone)) {
      updateData.phone = user.phone || trimmedId
      updateData.phoneVerifiedAt = now
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })
    }
  } else {
    // 3. If new user, create account with phone or email
    user = await prisma.user.create({
      data: {
        name: isEmail ? trimmedId.split("@")[0]! : `User_${trimmedId.slice(-4)}`,
        email: isEmail ? trimmedId : null,
        phone: !isEmail ? trimmedId : null,
        emailVerifiedAt: isEmail ? now : null,
        phoneVerifiedAt: !isEmail ? now : null,
      },
    })
  }

  // 4. Issue access & refresh tokens, set cookies, and store session in DB
  const { accessToken, refreshToken } = await createSession(event, user)

  return {
    status: "ok",
    message: "OTP verified successfully",
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
