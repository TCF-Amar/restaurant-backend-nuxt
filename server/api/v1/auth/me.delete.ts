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

  // Prisma schema has onDelete: Cascade, so deleting User deletes all their Sessions, Profile, and Addresses
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
})
