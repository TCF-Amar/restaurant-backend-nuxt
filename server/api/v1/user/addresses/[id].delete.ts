import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

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
    await tx.address.delete({
      where: { id },
    })

    // If the deleted address was default, promote the newest remaining address to default
    if (existing.isDefault) {
      const nextDefault = await tx.address.findFirst({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
      })
      if (nextDefault) {
        await tx.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        })
      }
    }
  })

  return {
    status: "ok",
    message: "Address deleted successfully",
  }
})
