defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Get current user profile",
    description: "Fetch profile of currently authenticated user",
    responses: {
      200: {
        description: "Authenticated user profile",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                  },
                },
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

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          avatarUrl: true,
        },
      },
      restaurantStaff: {
        select: {
          restaurantId: true,
          permissions: true,
          isPrimary: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    })
  }

  return {
    status: "ok",
    user,
  }
})
