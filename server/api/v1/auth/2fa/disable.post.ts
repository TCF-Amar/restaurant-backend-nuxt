import z from "zod"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const body = await readBody(event)

  const schema = z.object({
    code: z.string().optional(),
    password: z.string().optional(),
  }).refine((data) => data.code || data.password, {
    message: "Either authenticator code or current password is required to disable 2FA.",
  })

  const { code, password } = schema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, password: true, twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user || !user.twoFactorEnabled) {
    throw createError({
      statusCode: 400,
      statusMessage: "Two-factor authentication is not currently enabled.",
    })
  }

  let verified = false

  if (code && user.twoFactorSecret) {
    verified = verifyTotpToken(user.twoFactorSecret, code)
  }

  if (!verified && password && user.password) {
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      verified = await bcrypt.compare(password, user.password)
    } else {
      verified = user.password === password
    }
  }

  if (!verified) {
    throw createError({
      statusCode: 400,
      statusMessage: "Verification failed. Please provide a valid 6-digit code or your account password.",
    })
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: claims.sub },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  })

  return {
    status: "ok",
    message: "Two-factor authentication has been disabled.",
  }
})
