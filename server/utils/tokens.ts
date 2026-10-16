import { SignJWT, jwtVerify } from "jose"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import type { H3Event } from "h3"

export const ACCESS_TTL_SECONDS = 60 * 15 // 15 minutes
export const REFRESH_TTL_DAYS = 30
export const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000 // 30 days

export interface AccessClaims {
  sub: string // User ID
  sid: string // Session ID
  role: string // User role
}

function getJwtSecret(): Uint8Array {
  let secret: string | undefined
  try {
    secret = useRuntimeConfig().jwtSecret
  } catch {
    // fallback if outside nuxt context
  }

  secret =
    secret ||
    process.env.NUXT_JWT_SECRET ||
    "default-fallback-jwt-secret-min-32-chars-for-dev"

  return new TextEncoder().encode(secret)
}

/**
 * Sign a short-lived access JWT (15 minutes)
 */
export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return await new SignJWT({ sid: claims.sid, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getJwtSecret())
}

/**
 * Verify an access JWT
 */
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    })
    return {
      sub: payload.sub!,
      sid: payload.sid as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

/**
 * Compute SHA-256 hash of a string
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

/**
 * Generate a new secure refresh token: `<sessionId>.<random32Bytes>`
 */
export function newRefreshToken(sessionId: string): { token: string; hash: string } {
  const randomPart = randomBytes(32).toString("base64url")
  const token = `${sessionId}.${randomPart}`
  return { token, hash: sha256(token) }
}

const isSecureRequest = (event?: H3Event): boolean => {
  if (process.env.NODE_ENV === "production") return true
  if (event) {
    const proto = getHeader(event, "x-forwarded-proto")
    if (proto === "https") return true
  }
  return false
}

/**
 * Cookie options helper
 */
const cookieBase = (event?: H3Event) => ({
  httpOnly: true,
  secure: isSecureRequest(event),
  sameSite: "lax" as const,
  path: "/",
})

/**
 * Set access and refresh token cookies on the response
 */
export function setAuthCookies(
  event: H3Event,
  tokens: { accessToken: string; refreshToken?: string }
): void {
  const options = cookieBase(event)
  setCookie(event, "access_token", tokens.accessToken, {
    ...options,
    maxAge: ACCESS_TTL_SECONDS,
  })
  if (tokens.refreshToken) {
    setCookie(event, "refresh_token", tokens.refreshToken, {
      ...options,
      maxAge: Math.floor(REFRESH_TTL_MS / 1000),
    })
  }
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(event: H3Event): void {
  const options = cookieBase(event)
  deleteCookie(event, "access_token", options)
  deleteCookie(event, "refresh_token", options)
}

/**
 * Create a new user session in DB, issue tokens and set cookies
 */
export async function createSession(
  event: H3Event,
  user: { id: string; role: string }
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const sid = randomUUID()
  const { token, hash } = newRefreshToken(sid)

  const userAgent = getHeader(event, "user-agent")?.slice(0, 512)
  const clientIp = getRequestIP(event, { xForwardedFor: true })
  const validIp = clientIp && clientIp.trim() !== "" ? clientIp.trim() : null

  // Save session in database
  await prisma.session.create({
    data: {
      id: sid,
      userId: user.id,
      tokenHash: hash,
      userAgent: userAgent || null,
      ip: validIp,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  })

  // Sign access token
  const accessToken = await signAccessToken({
    sub: user.id,
    sid,
    role: user.role,
  })

  // Set HTTP-only cookies
  setAuthCookies(event, { accessToken, refreshToken: token })

  // Pre-warm active session cache in Redis
  await cacheSessionActive(sid)

  return {
    accessToken,
    refreshToken: token,
    sessionId: sid,
  }
}

/**
 * Extract and verify authenticated user from Authorization header or cookie
 */
export async function getAuthUser(event: H3Event): Promise<AccessClaims | null> {
  const authHeader = getHeader(event, "authorization")
  let token: string | undefined

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim()
  } else {
    token = getCookie(event, "access_token")
  }

  if (!token) {
    return null
  }

  return await verifyAccessToken(token)
}

/**
 * Require authenticated user or throw 401
 */
export async function requireAuthUser(event: H3Event): Promise<AccessClaims> {
  const claims = await getAuthUser(event)
  if (!claims) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Invalid or missing token",
    })
  }
  return claims
}
