import z from "zod"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Login with email or phone & password",
    description: "Authenticate user using their email address or phone number and password",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["password"],
            properties: {
              email: { type: "string", format: "email", example: "user@example.com" },
              phone: { type: "string", example: "+919876543210" },
              identifier: { type: "string", example: "user@example.com or +919876543210" },
              password: { type: "string", format: "password", example: "securePassword123" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
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
      401: {
        description: "Invalid credentials",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1),
  })

  const { email, phone, identifier, password } = schema.parse(body)
  const loginId = (identifier || email || phone)?.trim()

  if (!loginId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please provide an email or phone number",
    })
  }

  // Find user by either email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginId },
        { phone: loginId },
      ],
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    })
  }

  // Check if user account has been suspended by admin
  if (user.isSuspended) {
    throw createError({
      statusCode: 403,
      statusMessage: "Your account has been suspended by an administrator. Please contact support.",
    })
  }

  // Compare password using bcrypt
  if (!user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: "No password has been set for this account. Please sign in with OTP or contact administrator.",
    })
  }

  let isPasswordValid = false
  if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
    isPasswordValid = await bcrypt.compare(password, user.password)
  } else {
    // Backwards compatibility for legacy plain text passwords + auto-upgrade to bcrypt
    isPasswordValid = user.password === password
    if (isPasswordValid) {
      const upgradedHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: upgradedHash },
      })
      console.info(`[Auth:Login] Upgraded plain-text password to bcrypt hash for user ${user.id}`)
    }
  }

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    })
  }

  // If Two-Factor Authentication is enabled, require 6-digit TOTP code
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const tempToken = randomUUID()
    await redis.setex(`totp:login-temp:${tempToken}`, 300, JSON.stringify({ userId: user.id }))
    return {
      status: "2fa_required",
      require2FA: true,
      tempToken,
      message: "Two-factor authentication required. Please enter your 6-digit code.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    }
  }

  // Issue access & refresh tokens, set cookies, and create session in DB
  const { accessToken, refreshToken } = await createSession(event, user)

  return {
    status: "ok",
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
