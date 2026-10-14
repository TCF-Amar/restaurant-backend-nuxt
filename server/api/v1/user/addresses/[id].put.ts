import { z } from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["User Addresses"],
    summary: "Update saved address",
    description: "Modify an existing saved address by its ID for the authenticated user.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Address unique ID",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              label: { type: "string", example: "Work" },
              recipientName: { type: "string" },
              phone: { type: "string" },
              addressLine1: { type: "string" },
              addressLine2: { type: "string", nullable: true },
              landmark: { type: "string", nullable: true },
              city: { type: "string" },
              state: { type: "string" },
              postalCode: { type: "string" },
              latitude: { type: "number", nullable: true },
              longitude: { type: "number", nullable: true },
              isDefault: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Address updated successfully" },
      400: { description: "Invalid address data or parameters" },
      404: { description: "Address not found" },
    },
  },
})

const updateAddressSchema = z.object({
  label: z.string().min(1).optional(),
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters").optional(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").optional(),
  addressLine1: z.string().min(3, "Address line 1 is required").optional(),
  addressLine2: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2, "City is required").optional(),
  state: z.string().min(2, "State is required").optional(),
  postalCode: z.string().min(3, "Postal code is required").optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Address ID is required" })
  }

  const body = await readBody(event)
  const parsed = updateAddressSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid address data",
    })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: claims.sub },
  })

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: "Profile not found" })
  }

  // Ensure address belongs to this profile
  const existing = await prisma.address.findFirst({
    where: { id, profileId: profile.id },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Address not found" })
  }

  const data = parsed.data

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { profileId: profile.id, id: { not: id } },
        data: { isDefault: false },
      })
    }

    return tx.address.update({
      where: { id },
      data: {
        ...(data.label ? { label: data.label } : {}),
        ...(data.recipientName ? { recipientName: data.recipientName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.addressLine1 ? { addressLine1: data.addressLine1 } : {}),
        ...(data.addressLine2 !== undefined ? { addressLine2: data.addressLine2 } : {}),
        ...(data.landmark !== undefined ? { landmark: data.landmark } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.state ? { state: data.state } : {}),
        ...(data.postalCode ? { postalCode: data.postalCode } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      },
    })
  })

  return {
    status: "ok",
    address: updated,
  }
})
