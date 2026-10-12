export default defineEventHandler(async (event) => {
  const path = event.path

  // Skip internal framework paths, documentation, and static assets
  if (
    path.startsWith("/_") ||
    path.startsWith("/docs") ||
    path.startsWith("/scalar") ||
    path.startsWith("/openapi.json") ||
    /\.[a-z0-9]+(\?.*)?$/i.test(path)
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
      clearAuthCookies(event)
      claims = null
    }
  }

  // 2. If access token missing or expired, attempt silent rotation via refresh_token cookie
  // ONLY for protected application routes (never for auth management endpoints)
  if (!claims && !isAuthManagementRoute) {
    claims = await refreshFromCookie(event)
  }

  // 3. Attach authenticated session to event context
  event.context.auth = claims
})