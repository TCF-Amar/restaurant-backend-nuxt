import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin User Management"],
    summary: "Assign restaurant outlet staff & permissions",
    description: "Grant staff permissions (MANAGE_OUTLET, MANAGE_CATEGORIES, MANAGE_MENU_ITEMS, MANAGE_ORDERS) for a specific restaurant to a user.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["restaurantId", "permissions"],
            properties: {
              restaurantId: { type: "string" },
              permissions: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["MANAGE_OUTLET", "MANAGE_CATEGORIES", "MANAGE_MENU_ITEMS", "MANAGE_ORDERS"],
                },
              },
              isPrimary: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Restaurant staff assignment saved successfully" },
      400: { description: "Invalid payload or user/restaurant not found" },
      403: { description: "Forbidden" },
    },
  },
})

const assignAccessSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  permissions: z.array(
    z.enum(["MANAGE_OUTLET", "MANAGE_CATEGORIES", "MANAGE_MENU_ITEMS", "MANAGE_ORDERS"])
  ).min(1, "Select at least one permission"),
  isPrimary: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const userId = getRouterParam(event, "id")
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  const body = await readBody(event)
  const parsed = assignAccessSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid payload",
    })
  }

  const [user, restaurant] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.restaurant.findUnique({ where: { id: parsed.data.restaurantId } }),
  ])

  if (!user) throw createError({ statusCode: 404, statusMessage: "User not found" })
  if (!restaurant) throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })

  // Auto-promote to RESTAURANT_OWNER if currently CUSTOMER
  if (user.role === "CUSTOMER") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "RESTAURANT_OWNER" },
    })
  }

  const assignment = await prisma.restaurantStaff.upsert({
    where: {
      userId_restaurantId: {
        userId,
        restaurantId: parsed.data.restaurantId,
      },
    },
    create: {
      userId,
      restaurantId: parsed.data.restaurantId,
      permissions: parsed.data.permissions,
      isPrimary: parsed.data.isPrimary,
    },
    update: {
      permissions: parsed.data.permissions,
      isPrimary: parsed.data.isPrimary,
    },
    include: {
      restaurant: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  return {
    status: "ok",
    assignment,
  }
})
