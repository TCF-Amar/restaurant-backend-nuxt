import { z } from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Authentication & Profile"],
    summary: "Update current user profile",
    description: "Update display name, email, or contact phone for the currently authenticated account.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "John Doe" },
              email: { type: "string", format: "email", example: "user@example.com" },
              phone: { type: "string", example: "+15551234567" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Profile updated successfully" },
      400: { description: "Validation error or email/phone in use" },
      401: { description: "Unauthorized" },
    },
  },
})

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  const body = await readBody(event)
  const result = updateProfileSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || "Invalid profile data",
    })
  }

  const { name, email, phone } = result.data
  const cleanEmail = email ? email.trim().toLowerCase() : null
  const cleanPhone = phone ? phone.trim() : null

  // Check unique constraints for email
  if (cleanEmail) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: claims.sub },
      },
    })
    if (existingEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email address is already in use by another account",
      })
    }
  }

  // Check unique constraints for phone
  if (cleanPhone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: cleanPhone,
        id: { not: claims.sub },
      },
    })
    if (existingPhone) {
      throw createError({
        statusCode: 400,
        statusMessage: "Phone number is already in use by another account",
      })
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: claims.sub },
    data: {
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      profile: {
        upsert: {
          create: {
            phone: cleanPhone,
          },
          update: {
            phone: cleanPhone,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
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

  return {
    status: "ok",
    message: "Profile updated successfully",
    user: updatedUser,
  }
})
