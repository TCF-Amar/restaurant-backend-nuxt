import { prisma } from "../prisma"

export interface CartCalculationInputItem {
  menuItemId: string
  quantity: number
  variantId?: string | null
  addonIds?: string[] | null
  notes?: string | null
}

export interface CalculatedItem {
  id?: string
  menuItemId: string
  name: string
  imageUrl: string | null
  quantity: number
  basePrice: number
  unitPrice: number
  variantId: string | null
  variantName: string | null
  addons: Array<{ id: string; name: string; price: number }>
  addonsTotal: number
  totalPrice: number
  notes: string | null
}

export interface CartPricingBreakdown {
  items: CalculatedItem[]
  restaurant: {
    id: string
    name: string
    slug: string
    isActive: boolean
  }
  currency: string
  charges: {
    subtotal: number
    deliveryFee: number
    taxAmount: number
    taxRate: number // e.g. 0.05 (5%)
    packagingFee: number
    discountAmount: number
    totalAmount: number
  }
}

/**
 * Validates cart items against the database and calculates accurate pricing & charges breakdown.
 */
export async function calculateCartPricing(
  restaurantId: string,
  items: CartCalculationInputItem[],
  currency: string = "INR"
): Promise<CartPricingBreakdown> {
  if (!items || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Cart is empty" })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, slug: true, isActive: true },
  })

  if (!restaurant) {
    throw createError({ statusCode: 404, statusMessage: "Restaurant not found" })
  }

  if (!restaurant.isActive) {
    throw createError({ statusCode: 400, statusMessage: "This restaurant is currently inactive and not accepting orders" })
  }

  const itemIds = items.map((i) => i.menuItemId)
  const dbMenuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: itemIds },
      restaurantId,
    },
    include: {
      variants: true,
      addons: true,
    },
  })

  const itemMap = new Map(dbMenuItems.map((m) => [m.id, m]))

  const calculatedItems: CalculatedItem[] = []
  let subtotal = 0

  for (const item of items) {
    const dbItem = itemMap.get(item.menuItemId)
    if (!dbItem) {
      throw createError({
        statusCode: 400,
        statusMessage: `Menu item '${item.menuItemId}' does not exist or does not belong to this restaurant`,
      })
    }

    if (!dbItem.isAvailable) {
      throw createError({
        statusCode: 400,
        statusMessage: `Menu item '${dbItem.name}' is currently unavailable`,
      })
    }

    const quantity = Math.max(1, Math.min(item.quantity || 1, 99))
    let unitPrice = Number(dbItem.price)
    let selectedVariantName: string | null = null

    // Validate variant
    if (item.variantId && item.variantId.trim() !== "") {
      const variant = dbItem.variants.find((v) => v.id === item.variantId)
      if (!variant) {
        throw createError({
          statusCode: 400,
          statusMessage: `Variant '${item.variantId}' is invalid for '${dbItem.name}'`,
        })
      }
      unitPrice = Number(variant.price)
      selectedVariantName = variant.name
    }

    // Validate addons
    const selectedAddons: Array<{ id: string; name: string; price: number }> = []
    let addonsTotal = 0

    if (Array.isArray(item.addonIds) && item.addonIds.length > 0) {
      for (const addonId of item.addonIds) {
        const addon = dbItem.addons.find((a) => a.id === addonId)
        if (addon) {
          const addonPrice = Number(addon.price)
          selectedAddons.push({
            id: addon.id,
            name: addon.name,
            price: addonPrice,
          })
          addonsTotal += addonPrice
        }
      }
    }

    const itemTotalPrice = (unitPrice + addonsTotal) * quantity
    subtotal += itemTotalPrice

    calculatedItems.push({
      menuItemId: dbItem.id,
      name: dbItem.name,
      imageUrl: dbItem.imageUrl,
      quantity,
      basePrice: Number(dbItem.price),
      unitPrice,
      variantId: item.variantId || null,
      variantName: selectedVariantName,
      addons: selectedAddons,
      addonsTotal,
      totalPrice: Number(itemTotalPrice.toFixed(2)),
      notes: item.notes || null,
    })
  }

  // Calculate fees & taxes
  const isINR = currency.toUpperCase() === "INR"

  // Free delivery over ₹500 (or $30)
  const deliveryThreshold = isINR ? 500 : 30
  const standardDeliveryFee = isINR ? 40 : 2.99
  const deliveryFee = subtotal >= deliveryThreshold ? 0 : standardDeliveryFee

  // Standard restaurant packaging fee
  const packagingFee = isINR ? 20 : 1.50

  // 5% standard GST / sales tax
  const taxRate = 0.05
  const taxAmount = Number((subtotal * taxRate).toFixed(2))

  const discountAmount = 0.00

  const totalAmount = Number((subtotal + deliveryFee + packagingFee + taxAmount - discountAmount).toFixed(2))

  return {
    items: calculatedItems,
    restaurant,
    currency: currency.toUpperCase(),
    charges: {
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      taxAmount,
      taxRate,
      packagingFee: Number(packagingFee.toFixed(2)),
      discountAmount,
      totalAmount,
    },
  }
}
