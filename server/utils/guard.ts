import type { H3Event } from "h3"
import type { AccessClaims } from "./tokens"
import type { UserRole } from "@prisma/client"

declare module "h3" {
  interface H3EventContext {
    auth?: AccessClaims | null
  }
}

/**
 * Ensures the request is authenticated with an active session.
 * Throws 401 if unauthenticated.
 */
export function requireAuth(event: H3Event): AccessClaims {
  if (!event.context.auth) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Valid authentication session required",
    })
  }
  return event.context.auth
}

/**
 * Ensures the authenticated user possesses one of the allowed roles.
 * Throws 403 if role is insufficient.
 */
export function requireRole(
  event: H3Event,
  allowedRoles: UserRole | UserRole[] | string | string[]
): AccessClaims {
  const auth = requireAuth(event)
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(auth.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Insufficient role privileges",
    })
  }

  return auth
}
