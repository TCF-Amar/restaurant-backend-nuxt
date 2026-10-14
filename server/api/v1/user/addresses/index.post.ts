import { z } from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

const createAddressSchema = z.object({
  label: z.string().min(1).default("Home"),
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
  phone: z.string().min(6, "Phone number must be at least 6 characters"),
  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = createAddressSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid address data",
    })
  }

  const data = parsed.data

  const profile = await prisma.profile.upsert({
    where: { userId: claims.sub },
    create: { userId: claims.sub },
    update: {},
  })

  // Check if this is the user's first address
  const addressCount = await prisma.address.count({
    where: { profileId: profile.id },
  })

  // If first address or marked default, set isDefault = true
  const shouldBeDefault = data.isDefault || addressCount === 0

  const address = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { profileId: profile.id },
        data: { isDefault: false },
      })
    }

    return tx.address.create({
      data: {
        profileId: profile.id,
        label: data.label,
        recipientName: data.recipientName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        landmark: data.landmark || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : null,
        isDefault: shouldBeDefault,
      },
    })
  })

  return {
    status: "ok",
    address,
  }
})
