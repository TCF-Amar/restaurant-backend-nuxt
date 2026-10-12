import type { H3Event } from "h3"
import type { AccessClaims } from "./tokens"

export const SESSION_CACHE_TTL_SEC = 300 // 5 minutes cache in Redis

const getCacheKey = (sessionId: string) => `auth:session:${sessionId}`

/**
 * Checks whether a session is active and valid.
 * Checks Redis cache first; on cache miss, verifies against PostgreSQL via Prisma.
 */
export async function isSessionActive(sessionId: string, userId?: string): Promise<boolean> {
  const cacheKey = getCacheKey(sessionId)

  // 1. Try reading from Redis cache
  try {
    const cached = await redis.get(cacheKey)
    if (cached !== null) {
      return cached === "1"
    }
  } catch (err: unknown) {
    console.warn("[session-cache] Redis read error, falling back to database:", err)
  }

  // 2. Query source of truth (PostgreSQL)
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      ...(userId ? { userId } : {}),
      expiresAt: { gt: new Date() },
    },
    select: { id: true, expiresAt: true },
  })

  const isActive = !!session

  // 3. Cache the result in Redis
  try {
    if (isActive && session) {
      const remainingSec = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
      const ttl = Math.min(SESSION_CACHE_TTL_SEC, Math.max(1, remainingSec))
      await redis.set(cacheKey, "1", "EX", ttl)
    } else {
      // Cache negative lookup for 30s to absorb repeated attempts with revoked tokens
      await redis.set(cacheKey, "0", "EX", 30)
    }
  } catch (err: unknown) {
    console.warn("[session-cache] Redis write error:", err)
  }

  return isActive
}

/**
 * Pre-warms or updates active session cache in Redis
 */
export async function cacheSessionActive(
  sessionId: string,
  ttlSeconds = SESSION_CACHE_TTL_SEC
): Promise<void> {
  try {
    await redis.set(getCacheKey(sessionId), "1", "EX", ttlSeconds)
  } catch (err: unknown) {
    console.warn("[session-cache] Redis set error:", err)
  }
}

/**
 * Invalidates a single session's cache entry immediately
 */
export async function invalidateSessionCache(sessionId: string): Promise<void> {
  try {
    await redis.del(getCacheKey(sessionId))
    console.log(`[session-cache] Invalidation complete for session: ${sessionId}`)
  } catch (err: unknown) {
    console.warn("[session-cache] Redis del error:", err)
  }
}

/**
 * Revokes all sessions for a user (optionally keeping one session active)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<void> {
  try {
    // 1. Find all matching sessions
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      select: { id: true },
    })

    if (sessions.length === 0) return

    // 2. Delete from DB
    await prisma.session.deleteMany({
      where: {
        id: { in: sessions.map((s) => s.id) },
      },
    })

    // 3. Clear Redis cache for each
    await Promise.all(sessions.map((s) => invalidateSessionCache(s.id)))
    console.log(`[session] Revoked ${sessions.length} sessions for user ${userId}`)
  } catch (err) {
    console.warn(`[session] Error revoking sessions for user ${userId}:`, err)
  }
}

/**
 * Attempt to refresh tokens using presented refresh token or HTTP-only cookie
 */
export async function refreshSession(
  event: H3Event,
  refreshTokenOverride?: string
): Promise<{ claims: AccessClaims; accessToken: string; refreshToken: string } | null> {
  const path = event.path || "unknown"
  const source = refreshTokenOverride ? "parameter/body/header" : "HTTP-only cookie"
  console.log(`[session-refresh] Initiating refresh on '${path}' via ${source}`)

  const presented = refreshTokenOverride || getCookie(event, "refresh_token")
  if (!presented || typeof presented !== "string") {
    console.warn(`[session-refresh] Aborted: No refresh token presented on route '${path}'`)
    return null
  }

  const [sid] = presented.split(".")
  if (!sid) {
    console.warn(`[session-refresh] Aborted: Malformed refresh token presented on route '${path}'`)
    clearAuthCookies(event)
    return null
  }

  console.log(`[session-refresh] Validating session '${sid}' against database...`)
  const presentedHash = sha256(presented)
  const now = new Date()

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  })

  if (!session) {
    console.warn(`[session-refresh] Failed: Session '${sid}' not found in database`)
    clearAuthCookies(event)
    await invalidateSessionCache(sid)
    return null
  }

  if (session.tokenHash !== presentedHash) {
    console.warn(`[session-refresh] Failed: Token hash mismatch for session '${sid}' (possible reuse or already rotated)`)
    clearAuthCookies(event)
    await invalidateSessionCache(sid)
    return null
  }

  if (session.expiresAt < now) {
    console.warn(`[session-refresh] Failed: Session '${sid}' expired at ${session.expiresAt.toISOString()}`)
    clearAuthCookies(event)
    await invalidateSessionCache(sid)
    return null
  }

  const claims: AccessClaims = {
    sub: session.user.id,
    sid: session.id,
    role: session.user.role,
  }

  // Rotate to new refresh token
  const next = newRefreshToken(sid)
  await prisma.session.update({
    where: { id: sid },
    data: {
      tokenHash: next.hash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  })

  // Issue new access token
  const accessToken = await signAccessToken(claims)

  // Update cookies & Redis cache
  setAuthCookies(event, { accessToken, refreshToken: next.token })
  await cacheSessionActive(sid)

  console.log(`[session-refresh] Success! Rotated tokens for user '${claims.sub}' (role: ${claims.role}, session: '${sid}')`)

  return {
    claims,
    accessToken,
    refreshToken: next.token,
  }
}

/**
 * Convenience helper to refresh silently from cookie
 */
export async function refreshFromCookie(event: H3Event): Promise<AccessClaims | null> {
  console.log(`[session-refresh] Silent background refresh requested for '${event.path}'`)
  const result = await refreshSession(event)
  if (result) {
    console.log(`[session-refresh] Silent background refresh succeeded for session '${result.claims.sid}'`)
  }
  return result?.claims ?? null
}
