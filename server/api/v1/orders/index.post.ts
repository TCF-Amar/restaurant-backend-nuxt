import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99),
  variantId: z.string().optional().nullable(),
  addonIds: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
})

const createOrderSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  addressId: z.string().optional().nullable(),
  deliveryAddress: z
    .object({
      recipientName: z.string(),
      phone: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional().nullable(),
      landmark: z.string().optional().nullable(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
    })
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "UPI", "WALLET"]).default("CASH_ON_DELIVERY"),
  items: z.array(orderItemSchema).min(1, "Order must contain at least 1 item"),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = createOrderSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid order data",
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
    throw createError({ statusCode: 400, statusMessage: "A delivery address is required to place an order" })
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

    // If variant chosen, validate and use variant price
    if (item.variantId) {
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

    // If addons chosen, validate and sum addon prices
    const selectedAddons: Array<{ id: string; name: string; price: number }> = []
    if (item.addonIds && item.addonIds.length > 0) {
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
