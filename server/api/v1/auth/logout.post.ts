defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Logout user",
    description: "Invalidate current session and clear authentication cookies",
    responses: {
      200: {
        description: "Logged out successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string", example: "Logged out successfully" },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  // 1. Try to get session id from access token
  const claims = await getAuthUser(event)
  let sessionId = claims?.sid

  // 2. Fallback: extract session id from refresh token cookie or request body
  if (!sessionId) {
    const body = await readBody(event).catch(() => null)
    const refreshToken = body?.refreshToken || getCookie(event, "refresh_token")
    if (refreshToken && typeof refreshToken === "string") {
      sessionId = refreshToken.split(".")[0]
    }
  }

  // 3. Delete the session from the database and invalidate Redis cache
  if (sessionId) {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      })
    } catch {
      // Session might already be deleted or not found
    }
    await invalidateSessionCache(sessionId)
  }

  // 4. Clear authentication cookies
  clearAuthCookies(event)

  return {
    status: "ok",
    message: "Logged out and session deleted successfully",
  }
})
