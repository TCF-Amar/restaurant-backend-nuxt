defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Refresh tokens",
    description: "Exchange a valid refresh token for a new access token and a rotated refresh token. The refresh token can be passed in the request body or via the HTTP-only cookie.",
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              refreshToken: {
                type: "string",
                description: "Optional: Refresh token if not sent via cookie",
                example: "a0cf9afa-459d-4702-ae73-35998627487b.qF__noUG_Ro7iet2i3lvuuyr5p1a4Cvfmu0aIcrL2yw",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tokens refreshed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
              },
            },
          },
        },
      },
      401: {
        description: "Invalid or expired refresh token",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  // Read from request body, HTTP-only cookie, or headers
  const body = await readBody(event).catch(() => null)
  const authHeader = getHeader(event, "authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null
  const bearerAsRefreshToken =
    bearerToken && bearerToken.split(".").length === 2 ? bearerToken : null

  const presented =
    body?.refreshToken ||
    getCookie(event, "refresh_token") ||
    getHeader(event, "x-refresh-token") ||
    bearerAsRefreshToken

  if (!presented || typeof presented !== "string") {
    throw createError({
      statusCode: 401,
      statusMessage: "Refresh token is missing. Send refreshToken in request body, cookie, or X-Refresh-Token header",
    })
  }

  const result = await refreshSession(event, presented)

  if (!result) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired refresh token",
    })
  }

  // Return BOTH new access and new refresh tokens in JSON response
  return {
    status: "ok",
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }
})
