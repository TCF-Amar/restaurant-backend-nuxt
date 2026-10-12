import z from "zod"
import bcrypt from "bcryptjs"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    summary: "Register with email & password",
    description: "Create a new user account with email and password",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", example: "John Doe" },
              email: { type: "string", format: "email", example: "user@example.com" },
              password: { type: "string", format: "password", example: "securePassword123" },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "User registered successfully",
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
      400: {
        description: "Validation error or user already exists",
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    phone: z.string().optional(),
  })

  const validatedData = schema.parse(body)

  // Check if email or phone is already taken
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: validatedData.email },
        ...(validatedData.phone ? [{ phone: validatedData.phone }] : []),
      ],
    },
  })

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: "An account with this email or phone already exists",
    })
  }

  // Hash password with bcrypt before storing
  const hashedPassword = await bcrypt.hash(validatedData.password, 10)

  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })

  setResponseStatus(event, 201)
  return {
    status: "ok",
    user,
  }
})
