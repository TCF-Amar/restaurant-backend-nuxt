import type { H3Event } from "h3"
import type { AccessClaims } from "./tokens"
import type { UserRole, RestaurantPermission } from "@prisma/client"
import { prisma } from "./prisma"

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

/**
 * Strictly ensures the user is an ADMIN.
 * Restaurant owners and customers are forbidden.
 */
export function requireAdmin(event: H3Event): AccessClaims {
  return requireRole(event, "ADMIN")
}

export interface RestaurantAccessResult {
  auth: AccessClaims
  isSuperAdmin: boolean
  staffPermissions: RestaurantPermission[]
}

/**
 * Ensures the caller is authorized to operate on a specific restaurant.
 * - System ADMIN: Global access to any restaurant.
 * - RESTAURANT_OWNER: Must be assigned to `restaurantId` AND have `requiredPermission` (if specified).
 * - Others: 403 Forbidden.
 */
export async function requireRestaurantAccess(
  event: H3Event,
  restaurantId: string,
  requiredPermission?: RestaurantPermission
): Promise<RestaurantAccessResult> {
  const auth = requireAuth(event)

  // 1. Super Admin has unrestricted access to all restaurant outlets
  if (auth.role === "ADMIN") {
    return {
      auth,
      isSuperAdmin: true,
      staffPermissions: [
        "MANAGE_OUTLET",
        "MANAGE_CATEGORIES",
        "MANAGE_MENU_ITEMS",
        "MANAGE_ORDERS",
      ],
    }
  }

  // 2. Restaurant Owner: verify assignment and granular permissions
  if (auth.role === "RESTAURANT_OWNER") {
    const staff = await prisma.restaurantStaff.findUnique({
      where: {
        userId_restaurantId: {
          userId: auth.sub,
          restaurantId,
        },
      },
    })

    if (!staff) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: You are not assigned to this restaurant outlet",
      })
    }

    if (requiredPermission && !staff.permissions.includes(requiredPermission)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: Missing required permission [${requiredPermission}] for this restaurant`,
      })
    }

    return {
      auth,
      isSuperAdmin: false,
      staffPermissions: staff.permissions,
    }
  }

  throw createError({
    statusCode: 403,
    statusMessage: "Forbidden: Insufficient role privileges to manage restaurant resources",
  })
}
