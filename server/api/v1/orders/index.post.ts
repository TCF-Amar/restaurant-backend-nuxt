import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"

defineRouteMeta({
  openAPI: {
    tags: ["Orders & Checkout"],
    summary: "Place food order (Flutter Checkout)",
    description: "Submit a new food delivery order from Flutter app. Recalculates prices server-side, validates dish availability, snapshots delivery address, and creates order transaction.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["restaurantId", "items"],
            properties: {
              restaurantId: { type: "string", description: "Target restaurant ID" },
              addressId: { type: "string", nullable: true, description: "ID of user's saved address" },
              deliveryAddress: {
                type: "object",
                nullable: true,
                description: "Inline address snapshot if addressId not supplied",
              },
              notes: { type: "string", nullable: true, example: "Extra napkins please, ring bell." },
              paymentMethod: {
                type: "string",
                enum: ["CASH_ON_DELIVERY", "CARD", "UPI", "WALLET"],
                default: "CASH_ON_DELIVERY",
              },
              items: {
                type: "array",
                items: {
                  type: "object",
                  required: ["menuItemId", "quantity"],
                  properties: {
                    menuItemId: { type: "string" },
                    quantity: { type: "integer", minimum: 1, maximum: 99 },
                    variantId: { type: "string", nullable: true },
                    addonIds: { type: "array", items: { type: "string" } },
                    notes: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Order placed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string", example: "Order placed successfully" },
                order: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Invalid order payload or item out of stock" },
      404: { description: "Restaurant or item not found" },
    },
  },
})

const orderItemSchema = z.object({
  menuItemId: z.string({ error: "menuItemId is required" }).min(1, "menuItemId cannot be empty"),
  quantity: z.number({ error: "quantity must be a number" }).int().min(1, "Quantity must be at least 1").max(99),
  variantId: z.string().optional().nullable().or(z.literal("")),
  addonIds: z.array(z.string()).optional().nullable().default([]),
  notes: z.string().optional().nullable(),
})

const createOrderSchema = z.object({
  restaurantId: z.string({ error: "restaurantId is required" }).min(1, "restaurantId cannot be empty"),
  addressId: z.string().optional().nullable(),
  deliveryAddress: z
    .object({
      recipientName: z.string({ error: "recipientName is required" }).min(1, "recipientName cannot be empty"),
      phone: z.string({ error: "phone is required" }).min(1, "phone cannot be empty"),
      addressLine1: z.string({ error: "addressLine1 is required" }).min(1, "addressLine1 cannot be empty"),
      addressLine2: z.string().optional().nullable(),
      landmark: z.string().optional().nullable(),
      city: z.string({ error: "city is required" }).min(1, "city cannot be empty"),
      state: z.string({ error: "state is required" }).min(1, "state cannot be empty"),
      postalCode: z.string({ error: "postalCode is required" }).min(1, "postalCode cannot be empty"),
    })
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z
    .enum(["CASH_ON_DELIVERY", "CARD", "UPI", "WALLET", "STRIPE", "RAZORPAY", "ONLINE"])
    .optional()
    .default("CASH_ON_DELIVERY"),
  items: z
    .array(orderItemSchema, { error: "items array is required" })
    .min(1, "Order must contain at least 1 item"),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = (await readBody(event).catch(() => ({}))) || {}
  const parsed = createOrderSchema.safeParse(body)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const path = firstIssue?.path?.length ? firstIssue.path.join(".") : null
    const msg = firstIssue?.message || "Invalid input"
    const formattedError = path ? `Field '${path}': ${msg}` : msg

    throw createError({
      statusCode: 400,
      statusMessage: formattedError,
      data: {
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
    })
  }

  const { restaurantId, addressId, deliveryAddress, notes, paymentMethod, items } = parsed.data

  // Verify restaurant exists and is active
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, isActive: true },
  })

  if (!restaurant) {
    throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })
  }

  if (!restaurant.isActive) {
    throw createError({ statusCode: 400, statusMessage: "This restaurant is currently closed for orders" })
  }

  // Resolve delivery address
  let addressSnapshot: Record<string, any> | null = null
  let resolvedAddressId: string | null = null

  if (addressId) {
    const profile = await prisma.profile.findUnique({
      where: { userId: claims.sub },
    })

    const address = profile
      ? await prisma.address.findFirst({
        where: { id: addressId, profileId: profile.id },
      })
      : null

    if (!address) {
      throw createError({ statusCode: 400, statusMessage: "Specified delivery address was not found" })
    }

    resolvedAddressId = address.id
    addressSnapshot = {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    }
  } else if (deliveryAddress) {
    addressSnapshot = deliveryAddress
  } else {
    // Attempt fallback to user's saved default address
    const profile = await prisma.profile.findUnique({
      where: { userId: claims.sub },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    })

    const defaultAddress = profile?.addresses?.[0]
    if (defaultAddress) {
      resolvedAddressId = defaultAddress.id
      addressSnapshot = {
        label: defaultAddress.label,
        recipientName: defaultAddress.recipientName,
        phone: defaultAddress.phone,
        addressLine1: defaultAddress.addressLine1,
        addressLine2: defaultAddress.addressLine2,
        landmark: defaultAddress.landmark,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "A delivery address is required. Please provide addressId, deliveryAddress, or save a default address.",
      })
    }
  }

  // Fetch all menu items referenced in the order
  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))]
  const dbMenuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId,
    },
    include: {
      variants: true,
      addons: true,
    },
  })

  const menuItemMap = new Map(dbMenuItems.map((m) => [m.id, m]))

  // Calculate order items and total amount strictly server-side
  let totalOrderAmount = 0
  const orderItemsData: Array<{
    menuItemId: string
    quantity: number
    unitPrice: number
    notes: string | null
    customization: Record<string, any>
  }> = []

  for (const item of items) {
    const dbItem = menuItemMap.get(item.menuItemId)
    if (!dbItem) {
      throw createError({
        statusCode: 400,
        statusMessage: `Menu item '${item.menuItemId}' is not valid for this restaurant`,
      })
    }

    if (dbItem.isAvailable === false) {
      throw createError({
        statusCode: 400,
        statusMessage: `'${dbItem.name}' is currently out of stock`,
      })
    }

    let unitPrice = Number(dbItem.price)
    let selectedVariantName: string | null = null

    // If variant chosen, validate and use variant price (otherwise uses dbItem.price)
    if (item.variantId && item.variantId.trim() !== "") {
      const variant = dbItem.variants.find((v) => v.id === item.variantId)
      if (!variant) {
        throw createError({
          statusCode: 400,
          statusMessage: `Selected size/variant not found for '${dbItem.name}'`,
        })
      }
      unitPrice = Number(variant.price)
      selectedVariantName = variant.name
    }

    // If addons chosen, validate and sum addon prices (otherwise no extra charges)
    const selectedAddons: Array<{ id: string; name: string; price: number }> = []
    if (Array.isArray(item.addonIds) && item.addonIds.length > 0) {
      for (const addonId of item.addonIds) {
        const addon = dbItem.addons.find((a) => a.id === addonId)
        if (addon) {
          unitPrice += Number(addon.price)
          selectedAddons.push({
            id: addon.id,
            name: addon.name,
            price: Number(addon.price),
          })
        }
      }
    }

    const itemTotal = unitPrice * item.quantity
    totalOrderAmount += itemTotal

    orderItemsData.push({
      menuItemId: dbItem.id,
      quantity: item.quantity,
      unitPrice,
      notes: item.notes || null,
      customization: {
        itemName: dbItem.name,
        variant: selectedVariantName ? { id: item.variantId, name: selectedVariantName } : null,
        addons: selectedAddons,
      },
    })
  }

  // Generate unique order number (e.g., ORD-LK8B2-9A4F)
  const timestampPart = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `ORD-${timestampPart}-${randomPart}`

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        orderNumber,
        userId: claims.sub,
        restaurantId,
        status: "PENDING",
        totalAmount: totalOrderAmount,
        notes: notes || null,
        paymentMethod,
        addressId: resolvedAddressId,
        deliveryAddress: addressSnapshot,
        payment: {
          create: {
            userId: claims.sub,
            restaurantId,
            amount: totalOrderAmount,
            currency: ["UPI", "RAZORPAY"].includes(paymentMethod) ? "INR" : "USD",
            status: "PENDING",
            method: (["CASH_ON_DELIVERY", "CARD", "ONLINE", "STRIPE", "RAZORPAY", "WALLET"].includes(paymentMethod)
              ? paymentMethod
              : "CASH_ON_DELIVERY") as any,
            gateway: (paymentMethod === "RAZORPAY" || paymentMethod === "UPI"
              ? "RAZORPAY"
              : paymentMethod === "STRIPE" || paymentMethod === "CARD"
              ? "STRIPE"
              : "CASH_ON_DELIVERY") as any,
            transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          },
        },
        items: {
          create: orderItemsData.map((oi) => ({
            menuItemId: oi.menuItemId,
            quantity: oi.quantity,
            unitPrice: oi.unitPrice,
            notes: oi.notes,
            customization: oi.customization,
          })),
        },
      },
      include: {
        payment: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logoUrl: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })
  })

  return {
    status: "ok",
    message: "Order placed successfully",
    order,
  }
})
