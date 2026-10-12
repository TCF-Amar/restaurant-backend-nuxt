import z from "zod"
import { sendOtpEmailJob, sendOtpSmsJob } from "~~/server/utils/queue"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Send OTP",
    description: "Send a one-time verification code to an email or phone number",
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
                description: "Email address or phone number",
                example: "user@example.com",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP sent successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string", example: "OTP sent successfully" },
                cooldownSeconds: { type: "number", example: 60 },
              },
            },
          },
        },
      },
      429: {
        description: "Rate limited / cooldown active",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    identifier: z.string().min(3),
  })

  const { identifier } = schema.parse(body)

  const remainingCooldown = await checkOtpCooldown(identifier)
  if (remainingCooldown) {
    throw createError({
      statusCode: 429,
      statusMessage: `Please wait ${remainingCooldown}s before requesting a new OTP`,
    })
  }

  const otp = generateNumericOtp(6)
  await saveOtp(identifier, otp)

  // In development, log OTP to console for easy testing
  console.info(`[OTP] Generated OTP for ${identifier}: ${otp}`)
  if (process.env.NODE_ENV !== "production") {
    console.info(`[OTP] Generated OTP for ${identifier}: ${otp}`)
  }

  // Dispatch to background worker queue (Email / SMS)
  const isEmail = identifier.includes("@")
  if (isEmail) {
    await sendOtpEmailJob(identifier, otp, 5)
  } else {
    await sendOtpSmsJob(identifier, otp)
  }

  return {
    status: "ok",
    otp,
    message: "OTP sent successfully",
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  }
})
