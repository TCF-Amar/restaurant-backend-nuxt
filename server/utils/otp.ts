import { randomInt } from "node:crypto"
import bcrypt from "bcryptjs"
import { redis } from "./redis"

export const OTP_TTL_SECONDS = 5 * 60 // 5 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 60 // 60 seconds
export const OTP_SALT_ROUNDS = 10

export function generateNumericOtp(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return String(randomInt(min, max + 1))
}

const otpKey = (identifier: string) => `otp:${identifier.toLowerCase()}`
const cooldownKey = (identifier: string) => `otp:cooldown:${identifier.toLowerCase()}`

export async function checkOtpCooldown(identifier: string): Promise<number | null> {
  const ttl = await redis.ttl(cooldownKey(identifier))
  return ttl > 0 ? ttl : null
}

/**
 * Hash OTP code using bcrypt before storing in Redis
 */
export async function saveOtp(identifier: string, code: string): Promise<void> {
  const hashedCode = await bcrypt.hash(code, OTP_SALT_ROUNDS)

  // Store hashed OTP with 5 min expiry
  await redis.setex(otpKey(identifier), OTP_TTL_SECONDS, hashedCode)
  // Set cooldown key for 60 seconds to prevent rapid spamming
  await redis.setex(cooldownKey(identifier), OTP_RESEND_COOLDOWN_SECONDS, "1")

  console.log(`[otp] Hashed OTP saved to Redis for '${identifier}' (key: ${otpKey(identifier)})`)
}

/**
 * Verify input OTP code against bcrypt hash in Redis and consume on success
 */
export async function verifyAndConsumeOtp(
  identifier: string,
  inputCode: string
): Promise<boolean> {
  const storedHash = await redis.get(otpKey(identifier))
  if (!storedHash) {
    console.warn(`[otp] Verification failed: No OTP found in Redis for '${identifier}'`)
    return false
  }

  // Verify with bcrypt (with backwards compatibility for plain text if any)
  let isValid = false
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    isValid = await bcrypt.compare(inputCode.trim(), storedHash)
  } else {
    isValid = storedHash === inputCode.trim()
  }

  if (!isValid) {
    console.warn(`[otp] Verification failed: Code mismatch for '${identifier}'`)
    return false
  }

  // Once consumed successfully, remove OTP
  await redis.del(otpKey(identifier))
  console.log(`[otp] OTP successfully verified and consumed for '${identifier}'`)
  return true
}
