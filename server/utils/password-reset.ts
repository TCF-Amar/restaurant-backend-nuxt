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
 * Validate a reset token in Redis without consuming it, returning the associated userId
 */
export async function getPasswordResetTokenUserId(token: string): Promise<string | null> {
  const key = resetTokenKey(token)
  return await redis.get(key)
}

/**
 * Invalidate / delete a reset token in Redis
 */
export async function invalidatePasswordResetToken(token: string): Promise<void> {
  const key = resetTokenKey(token)
  await redis.del(key)
}

/**
 * Verify and consume (delete) a reset token in Redis, returning the associated userId
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const userId = await getPasswordResetTokenUserId(token)
  if (!userId) {
    return null
  }
  // Single-use token: remove immediately upon consumption
  await invalidatePasswordResetToken(token)
  return userId
}
