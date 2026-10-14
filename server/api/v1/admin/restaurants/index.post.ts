import z from "zod"

defineRouteMeta({
  openAPI: {
    tags: ["Admin Restaurant Management"],
    summary: "Create new restaurant outlet",
    description: "Provision a new restaurant entity on the platform. Requires Admin privileges.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "slug"],
            properties: {
              name: { type: "string", example: "Bistro Napoli" },
              slug: { type: "string", example: "bistro-napoli" },
              description: { type: "string" },
              address: { type: "string" },
              phone: { type: "string" },
              logoUrl: { type: "string" },
              bannerUrl: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Restaurant created successfully" },
      400: { description: "Validation error or slug already taken" },
      403: { description: "Forbidden" },
    },
  },
})


const createRestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
})

export default defineEventHandler(async (event) => {
  // STRICT: Only ADMIN can create restaurant outlets
  requireAdmin(event)

  const body = await readBody(event)
  const parsed = createRestaurantSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid restaurant data",
    })
  }

  // Ensure slug uniqueness
  const existing = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.slug },
  })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "A restaurant with this slug already exists",
    })
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      address: parsed.data.address,
      phone: parsed.data.phone,
      logoUrl: parsed.data.logoUrl || null,
      bannerUrl: parsed.data.bannerUrl || null,
    },
  })

  return {
    status: "ok",
    restaurant,
  }
})
