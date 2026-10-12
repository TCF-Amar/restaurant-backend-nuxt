import { randomBytes } from "node:crypto"
import { redis } from "./redis"

export const RESET_TOKEN_TTL_SECONDS = 10 * 60 // 10 minutes

const resetTokenKey = (token: string) => `pwd:reset:${token}`

/**
 * Generate a cryptographically secure reset token for a verified user and store in Redis
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  await redis.setex(resetTokenKey(token), RESET_TOKEN_TTL_SECONDS, userId)
  console.log(`[password-reset] Generated reset token for user ${userId} (TTL: ${RESET_TOKEN_TTL_SECONDS}s)`)
  return token
}

/**
 * Verify and consume (delete) a reset token in Redis, returning the associated userId
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const key = resetTokenKey(token)
  const userId = await redis.get(key)
  if (!userId) {
    return null
  }
  // Single-use token: remove immediately upon consumption
  await redis.del(key)
  return userId
}
