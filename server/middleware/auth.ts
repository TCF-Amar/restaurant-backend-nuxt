import { logger } from "../utils/logger"

export default defineEventHandler(async (event) => {
  const path = event.path
  const pathname = path.split("?")[0]

  // Skip internal framework paths, documentation, and non-API static files
  if (
    path.startsWith("/_") ||
    path.startsWith("/docs") ||
    path.startsWith("/scalar") ||
    path.startsWith("/openapi.json") ||
    (!path.startsWith("/api") && /\.[a-z0-9]+$/i.test(pathname!.toString()))
  ) {
    return
  }

  // Auth management routes handle their own credentials/tokens.
  // We must NOT perform automatic silent refresh on them (especially /api/v1/auth/refresh
  // which would rotate the token before the handler runs, causing a 401 hash mismatch!).
  const isAuthManagementRoute =
    path.startsWith("/api/v1/auth/refresh") ||
    path.startsWith("/api/v1/auth/login") ||
    path.startsWith("/api/v1/auth/register") ||
    path.startsWith("/api/v1/auth/otp") ||
    path.startsWith("/api/v1/auth/google") ||
    path.startsWith("/api/v1/auth/logout") ||
    path.startsWith("/api/v1/auth/password/forgot") ||
    path.startsWith("/api/v1/auth/password/verify") ||
    path.startsWith("/api/v1/auth/password/reset")

  const authHeader = getHeader(event, "authorization")
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null
  const access = bearerToken || getCookie(event, "access_token")

  let claims = access ? await verifyAccessToken(access) : null

  // 1. Verify active session against Redis cache (falling back to DB)
  if (claims) {
    const activeSession = await isSessionActive(claims.sid, claims.sub)
    if (!activeSession) {
      logger.warn(`[auth-middleware] Session '${claims.sid}' is no longer active for user '${claims.sub}'. Clearing cookies.`)
      clearAuthCookies(event)
      claims = null
    }
  }

  // 2. If access token missing or expired, attempt silent rotation via refresh_token cookie
  // ONLY for protected application routes (never for auth management endpoints)
  if (!claims && !isAuthManagementRoute) {
    const hasRefreshCookie = !!getCookie(event, "refresh_token")
    if (!hasRefreshCookie && !bearerToken) {
      logger.warn(`[auth-middleware] Unauthenticated request to '${path}': No access_token and no refresh_token cookie`)
    } else {
      claims = await refreshFromCookie(event)
      if (!claims) {
        logger.warn(`[auth-middleware] Silent refresh failed on '${path}'`)
      }
    }
  }

  // 3. Attach authenticated session to event context
  event.context.auth = claims
})