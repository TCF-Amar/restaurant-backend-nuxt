import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

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
