import z from "zod"


const assignOwnerSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissions: z.array(
    z.enum(["MANAGE_OUTLET", "MANAGE_CATEGORIES", "MANAGE_MENU_ITEMS", "MANAGE_ORDERS"])
  ).min(1, "At least one permission must be granted"),
  isPrimary: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can assign restaurant owners and grant permissions
  requireAdmin(event)

  const restaurantId = getRouterParam(event, "id")
  if (!restaurantId) {
    throw createError({ statusCode: 400, statusMessage: "Restaurant ID is required" })
  }

  const body = await readBody(event)
  const parsed = assignOwnerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid assignment data",
    })
  }

  // 1. Verify restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  })
  if (!restaurant) {
    throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })
  }

  // 2. Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
  })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  // If user is currently CUSTOMER, promote them to RESTAURANT_OWNER
  if (user.role === "CUSTOMER") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "RESTAURANT_OWNER" },
    })
  }

  // 3. Upsert restaurant staff assignment and permissions
  const assignment = await prisma.restaurantStaff.upsert({
    where: {
      userId_restaurantId: {
        userId: parsed.data.userId,
        restaurantId,
      },
    },
    create: {
      userId: parsed.data.userId,
      restaurantId,
      permissions: parsed.data.permissions,
      isPrimary: parsed.data.isPrimary,
    },
    update: {
      permissions: parsed.data.permissions,
      isPrimary: parsed.data.isPrimary,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    status: "ok",
    assignment,
  }
})
