import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Login with email or phone & password",
    description: "Authenticate user using their email address or phone number and password",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["password"],
            properties: {
              email: { type: "string", format: "email", example: "user@example.com" },
              phone: { type: "string", example: "+919876543210" },
              identifier: { type: "string", example: "user@example.com or +919876543210" },
              password: { type: "string", format: "password", example: "securePassword123" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
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
      401: {
        description: "Invalid credentials",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1),
  })

  const { email, phone, identifier, password } = schema.parse(body)
  const loginId = (identifier || email || phone)?.trim()

  if (!loginId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please provide an email or phone number",
    })
  }

  // Find user by either email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginId },
        { phone: loginId },
      ],
    },
  })

  // Compare password
  if (!user || !user.password || user.password !== password) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    })
  }

  // Issue access & refresh tokens, set cookies, and create session in DB
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
