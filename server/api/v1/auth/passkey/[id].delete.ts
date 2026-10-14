defineRouteMeta({
  openAPI: {
    tags: ["Passkeys & WebAuthn"],
    summary: "Delete passkey",
    description: "Remove a FIDO2 passkey credential from the authenticated account.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Passkey credential ID" },
    ],
    responses: {
      200: { description: "Passkey removed successfully" },
      401: { description: "Unauthorized" },
      404: { description: "Passkey not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = await requireAuthUser(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Passkey ID is required" })
  }

  const passkey = await prisma.passkey.findUnique({
    where: { id },
  })

  if (!passkey || passkey.userId !== claims.sub) {
    throw createError({ statusCode: 404, statusMessage: "Passkey not found" })
  }

  await prisma.passkey.delete({
    where: { id },
  })

  return {
    status: "ok",
    message: "Passkey removed successfully.",
  }
})
