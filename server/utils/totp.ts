import * as OTPAuth from "otpauth"
import QRCode from "qrcode"

export function createTotpInstance(secret?: string, label = "FoodHub Account") {
  return new OTPAuth.TOTP({
    issuer: "FoodHub",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret ? OTPAuth.Secret.fromBase32(secret) : new OTPAuth.Secret({ size: 20 }),
  })
}

export async function generateTotpSetup(email: string) {
  const totp = createTotpInstance(undefined, email)
  const base32Secret = totp.secret.base32
  const otpauthUri = totp.toString()

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    margin: 2,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  return {
    secret: base32Secret,
    uri: otpauthUri,
    qrCode: qrCodeDataUrl,
  }
}

export function verifyTotpToken(secret: string, token: string): boolean {
  if (!secret || !token) return false
  const cleanToken = token.trim().replace(/\s+/g, "")
  if (cleanToken.length !== 6) return false

  try {
    const totp = createTotpInstance(secret)
    const delta = totp.validate({ token: cleanToken, window: 1 })
    return delta !== null
  } catch (err) {
    console.error("[TOTP] Verification error:", err)
    return false
  }
}
