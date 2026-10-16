import z from "zod"
import { requireAuth } from "../../../../utils/guard"
import { prisma } from "../../../../utils/prisma"

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]),
  refundReason: z.string().optional(),
})

defineRouteMeta({
  openAPI: {
    tags: ["Payments & Transactions"],
    summary: "Update payment status / record refund",
    description: "Update the status of a payment (e.g. mark COMPLETED upon cash delivery, or REFUNDED with reason). Requires Admin or Restaurant Staff access.",
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Payment record ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string", enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"] },
              refundReason: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Payment status updated successfully" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Payment not found" },
    },
  },
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Payment ID is required" })
  }

  const body = await readBody(event)
  const parsed = updateStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid payload",
    })
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { restaurant: true },
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment record not found" })
  }

  // Authorization check: Only ADMIN can view and modify payment transactions
  if (claims.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Only administrators can update payment transactions",
    })
  }

  const { status, refundReason } = parsed.data

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status,
      refundReason: status === "REFUNDED" ? refundReason || "Requested by merchant" : undefined,
      refundedAt: status === "REFUNDED" ? new Date() : undefined,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
    payment: updatedPayment,
  }
})
