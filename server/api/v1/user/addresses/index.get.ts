import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["User Addresses"],
    summary: "Get saved address book",
    description: "Fetch all saved delivery addresses for the authenticated user, ordered with default address first.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of saved addresses retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                addresses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      label: { type: "string", example: "Home" },
                      recipientName: { type: "string", example: "John Doe" },
                      phone: { type: "string", example: "+15551234567" },
                      addressLine1: { type: "string", example: "123 Main St, Apt 4B" },
                      addressLine2: { type: "string", nullable: true },
                      landmark: { type: "string", nullable: true },
                      city: { type: "string", example: "New York" },
                      state: { type: "string", example: "NY" },
                      postalCode: { type: "string", example: "10001" },
                      latitude: { type: "number", nullable: true },
                      longitude: { type: "number", nullable: true },
                      isDefault: { type: "boolean", example: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized session" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)

  // Ensure user has a profile record
  const profile = await prisma.profile.upsert({
    where: { userId: claims.sub },
    create: { userId: claims.sub },
    update: {},
  })

  const addresses = await prisma.address.findMany({
    where: { profileId: profile.id },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  })

  return {
    status: "ok",
    addresses,
  }
})
