import { requireAuth } from "../../../../../utils/guard"
import { prisma } from "../../../../../utils/prisma"

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Address ID is required" })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: claims.sub },
  })

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: "Profile not found" })
  }

  const existing = await prisma.address.findFirst({
    where: { id, profileId: profile.id },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Address not found" })
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { profileId: profile.id },
      data: { isDefault: false },
    })

    await tx.address.update({
      where: { id },
      data: { isDefault: true },
    })
  })

  return {
    status: "ok",
    message: "Address set as default successfully",
  }
})
