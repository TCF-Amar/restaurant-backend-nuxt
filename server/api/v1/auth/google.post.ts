import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Google OAuth Login / Link",
    description: "Authenticate with Google. If an account already exists with the same email or phone, links Google to the existing account so all login methods access the same user.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["googleId", "email"],
            properties: {
              googleId: { type: "string", example: "10982347102938471" },
              email: { type: "string", format: "email", example: "user@gmail.com" },
              name: { type: "string", example: "Google User" },
              avatarUrl: { type: "string", example: "https://lh3.googleusercontent.com/..." },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Google login successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string", nullable: true },
                    phone: { type: "string", nullable: true },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    googleId: z.string().min(1),
    email: z.string().email(),
    name: z.string().optional(),
    avatarUrl: z.string().optional(),
  })

  const { googleId, email, name, avatarUrl } = schema.parse(body)
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date()

  // 1. Find user by googleId OR by email (multi-login same account linking!)
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email: normalizedEmail },
      ],
    },
  })

  if (user) {
    // Account exists! Link googleId and verify email if not already set
    const updateData: { googleId?: string; emailVerifiedAt?: Date } = {}
    if (!user.googleId) {
      updateData.googleId = googleId
    }
    if (!user.emailVerifiedAt) {
      updateData.emailVerifiedAt = now
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })
    }
  } else {
    // 2. No account exists: Create new user with Google identity
    user = await prisma.user.create({
      data: {
        name: name || normalizedEmail.split("@")[0] || "User",
        email: normalizedEmail,
        googleId,
        emailVerifiedAt: now,
      },
    })
  }

  // 3. Upsert OAuth provider entry
  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: "google",
        providerUserId: googleId,
      },
    },
    update: {},
    create: {
      provider: "google",
      providerUserId: googleId,
      userId: user.id,
    },
  })

  // 4. Update avatar in profile if provided
  if (avatarUrl) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { avatarUrl },
      create: { userId: user.id, avatarUrl },
    })
  }

  // 5. Issue tokens and session
  const { accessToken, refreshToken } = await createSession(event, user)

  return {
    status: "ok",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  }
})
