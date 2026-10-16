import z from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { verifyAndConsumeOtp } from "../../../utils/otp"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Verify Email or Phone with OTP",
    description: "Verify and link an email or mobile phone number to the authenticated user account using a 6-digit OTP.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["type", "value", "code"],
            properties: {
              type: { type: "string", enum: ["email", "phone"] },
              value: { type: "string", example: "user@example.com or +15551234567" },
              code: { type: "string", example: "123456" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Contact verified and linked successfully" },
      400: { description: "Invalid code or already in use" },
      401: { description: "Unauthorized" },
    },
  },
})

const verifyContactSchema = z.object({
  type: z.enum(["email", "phone"]),
  value: z.string().min(3),
  code: z.string().length(6),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  const body = await readBody(event)
  const parsed = verifyContactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid payload",
    })
  }

  const { type, value, code } = parsed.data
  const cleanValue = value.trim()

  // Verify and consume OTP
  const isValid = await verifyAndConsumeOtp(cleanValue, code.trim())
  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid or expired 6-digit verification code",
    })
  }

  const now = new Date()

  if (type === "email") {
    const cleanEmail = cleanValue.toLowerCase()
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: claims.sub },
      },
    })
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "This email address is already registered to another account",
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: claims.sub },
      data: {
        email: cleanEmail,
        emailVerifiedAt: now,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        role: true,
      },
    })

    return {
      status: "ok",
      message: "Email address verified successfully",
      user: updatedUser,
    }
  } else {
    // type === "phone"
    const existing = await prisma.user.findFirst({
      where: {
        phone: cleanValue,
        id: { not: claims.sub },
      },
    })
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "This phone number is already registered to another account",
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: claims.sub },
      data: {
        phone: cleanValue,
        phoneVerifiedAt: now,
        profile: {
          upsert: {
            create: { phone: cleanValue },
            update: { phone: cleanValue },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        role: true,
      },
    })

    return {
      status: "ok",
      message: "Phone number verified successfully",
      user: updatedUser,
    }
  }
})
