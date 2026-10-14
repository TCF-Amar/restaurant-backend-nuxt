defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Delete account",
    description: "Permanently delete the authenticated user account and cascade delete all their sessions, profiles, and addresses",
    responses: {
      200: {
        description: "Account and all sessions deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string", example: "Account and all associated session data deleted successfully" },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  try {
    // Prisma schema has onDelete: Cascade for Sessions, Profile, Addresses, Cart, Orders, Payments, OAuthAccounts, Passkeys, and RestaurantStaff
    await prisma.user.delete({
      where: { id: claims.sub },
    })

    // Invalidate Redis session cache
    await invalidateSessionCache(claims.sid)

    // Clear auth cookies
    clearAuthCookies(event)

    return {
      status: "ok",
      message: "Account and all associated session data deleted successfully",
    }
  } catch (error: any) {
    console.error("[Auth:DeleteAccount] Error deleting user account:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error?.message || "Failed to delete account",
    })
  }
})
