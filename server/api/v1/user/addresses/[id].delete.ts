import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["User Addresses"],
    summary: "Delete saved address",
    description: "Remove an address from the user's address book. If the deleted address was default, automatically assigns a remaining address as default.",
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
    responses: {
      200: { description: "Address deleted successfully" },
      404: { description: "Address not found" },
    },
  },
})

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
