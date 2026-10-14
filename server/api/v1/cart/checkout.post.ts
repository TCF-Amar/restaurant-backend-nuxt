import { z } from "zod"
import { requireAuth } from "../../../utils/guard"
import { prisma } from "../../../utils/prisma"
import { calculateCartPricing } from "../../../utils/cart/pricing"
import { createRazorpayOrder, getRazorpayKeyId } from "../../../utils/payment/razorpay"
import { createStripePaymentIntent, getStripePublishableKey } from "../../../utils/payment/stripe"

defineRouteMeta({
  openAPI: {
    tags: ["Cart & Pricing"],
    summary: "Checkout Cart & Initiate Payment / Place Order",
    description: "Checkout user's active cart. If Cash on Delivery, order is placed immediately and cart is cleared. If UPI or Card, creates order in PAYMENT_PENDING state and returns gateway credentials (Razorpay/Stripe); order is only confirmed to kitchen once payment is verified.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["paymentMethod"],
            properties: {
              paymentMethod: {
                type: "string",
                enum: ["CASH_ON_DELIVERY", "UPI", "RAZORPAY", "CARD", "STRIPE", "WALLET"],
                example: "UPI",
              },
              addressId: { type: "string", description: "Saved user address ID" },
              deliveryAddress: { type: "object", description: "Custom address object snapshot" },
              notes: { type: "string", description: "Special instructions for delivery / kitchen" },
              currency: { type: "string", default: "INR" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Order placed or payment intent returned",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                requiresPayment: { type: "boolean" },
                gateway: { type: "string" },
                order: { type: "object" },
                payment: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Empty cart, invalid address, or item unavailable" },
    },
  },
})

const checkoutSchema = z.object({
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "UPI", "RAZORPAY", "CARD", "STRIPE", "WALLET"]),
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
  currency: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const claims = requireAuth(event)
  const body = await readBody(event)
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Invalid checkout payload",
    })
  }

  const { paymentMethod, addressId, deliveryAddress, notes, currency } = parsed.data

  // Fetch active user cart
  const cart = await prisma.cart.findUnique({
    where: { userId: claims.sub },
    include: {
      items: true,
      restaurant: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
        },
      },
    },
  })

  if (!cart || !cart.restaurantId || cart.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Your shopping cart is empty" })
  }

  const selectedCurrency = currency || (["UPI", "RAZORPAY"].includes(paymentMethod) ? "INR" : "USD")

  // Calculate and validate live prices & charges
  const pricing = await calculateCartPricing(
    cart.restaurantId,
    cart.items.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      variantId: i.variantId,
      addonIds: i.addonIds,
      notes: i.notes,
    })),
    selectedCurrency
  )

  // Resolve delivery address
  let resolvedAddressId: string | null = null
  let addressSnapshot: any = null

  if (addressId) {
    const profile = await prisma.profile.findUnique({ where: { userId: claims.sub } })
    const address = profile
      ? await prisma.address.findFirst({
          where: { id: addressId, profileId: profile.id },
        })
      : null

    if (!address) {
      throw createError({ statusCode: 404, statusMessage: "Specified delivery address not found" })
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
    // Fallback to user default address
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
        statusMessage: "Delivery address is required. Please provide addressId, deliveryAddress, or save a default address.",
      })
    }
  }

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // -------------------------------------------------------------------------
  // SCENARIO 1: CASH ON DELIVERY
  // -------------------------------------------------------------------------
  if (paymentMethod === "CASH_ON_DELIVERY") {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: claims.sub,
          restaurantId: cart.restaurantId!,
          status: "PENDING",
          totalAmount: pricing.charges.totalAmount,
          subtotal: pricing.charges.subtotal,
          deliveryFee: pricing.charges.deliveryFee,
          taxAmount: pricing.charges.taxAmount,
          packagingFee: pricing.charges.packagingFee,
          discountAmount: pricing.charges.discountAmount,
          notes: notes || null,
          paymentMethod: "CASH_ON_DELIVERY",
          addressId: resolvedAddressId,
          deliveryAddress: addressSnapshot,
          payment: {
            create: {
              userId: claims.sub,
              restaurantId: cart.restaurantId!,
              amount: pricing.charges.totalAmount,
              currency: pricing.currency,
              status: "PENDING",
              method: "CASH_ON_DELIVERY",
              gateway: "CASH_ON_DELIVERY",
              transactionId: `TXN-COD-${orderNumber}`,
            },
          },
          items: {
            create: pricing.items.map((oi) => ({
              menuItemId: oi.menuItemId,
              quantity: oi.quantity,
              unitPrice: oi.unitPrice,
              notes: oi.notes,
              customization: {
                variantName: oi.variantName,
                variantId: oi.variantId,
                addons: oi.addons,
              },
            })),
          },
        },
        include: {
          payment: true,
          restaurant: { select: { id: true, name: true, phone: true } },
          items: true,
        },
      })

      // Wipe customer's cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.update({ where: { id: cart.id }, data: { restaurantId: null } })

      return createdOrder
    })

    return {
      status: "ok",
      message: "Order placed successfully with Cash on Delivery",
      requiresPayment: false,
      paymentMethod: "CASH_ON_DELIVERY",
      order,
    }
  }

  // -------------------------------------------------------------------------
  // SCENARIO 2: ONLINE PAYMENT (UPI / CARD via Razorpay or Stripe)
  // -------------------------------------------------------------------------
  const isRazorpay = paymentMethod === "UPI" || paymentMethod === "RAZORPAY"
  const isStripe = paymentMethod === "CARD" || paymentMethod === "STRIPE"

  if (!isRazorpay && !isStripe) {
    throw createError({ statusCode: 400, statusMessage: "Unsupported online payment method" })
  }

  // Create order in PAYMENT_PENDING state
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: claims.sub,
      restaurantId: cart.restaurantId!,
      status: "PAYMENT_PENDING",
      totalAmount: pricing.charges.totalAmount,
      subtotal: pricing.charges.subtotal,
      deliveryFee: pricing.charges.deliveryFee,
      taxAmount: pricing.charges.taxAmount,
      packagingFee: pricing.charges.packagingFee,
      discountAmount: pricing.charges.discountAmount,
      notes: notes || null,
      paymentMethod,
      addressId: resolvedAddressId,
      deliveryAddress: addressSnapshot,
      items: {
        create: pricing.items.map((oi) => ({
          menuItemId: oi.menuItemId,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
          notes: oi.notes,
          customization: {
            variantName: oi.variantName,
            variantId: oi.variantId,
            addons: oi.addons,
          },
        })),
      },
    },
    include: {
      restaurant: { select: { id: true, name: true } },
    },
  })

  // --- Razorpay (UPI & Indian Cards) ---
  if (isRazorpay) {
    try {
      const rzpOrder = await createRazorpayOrder({
        amount: pricing.charges.totalAmount,
        currency: "INR",
        receipt: order.id,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: claims.sub,
          restaurantId: order.restaurantId,
        },
      })

      // Create linked payment record in PENDING state
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: claims.sub,
          restaurantId: order.restaurantId,
          amount: pricing.charges.totalAmount,
          currency: "INR",
          status: "PENDING",
          method: "RAZORPAY",
          gateway: "RAZORPAY",
          gatewayOrderId: rzpOrder.id,
          transactionId: `TXN-${order.id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        },
      })

      return {
        status: "ok",
        message: "Payment initiated. Please confirm payment via UPI app to place your order.",
        requiresPayment: true,
        gateway: "RAZORPAY",
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount, // in paise
        currency: "INR",
        keyId: getRazorpayKeyId(),
        customer: {
          name: cart.user?.name || "",
          email: cart.user?.email || "",
          phone: cart.user?.phone || "",
        },
        businessName: order.restaurant.name,
        payment,
      }
    } catch (err: any) {
      // Clean up order if intent generation failed
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to initiate Razorpay order: ${err?.message || "Internal error"}`,
      })
    }
  }

  // --- Stripe (Cards & Apple/Google Pay) ---
  if (isStripe) {
    try {
      const paymentIntent = await createStripePaymentIntent({
        amount: pricing.charges.totalAmount,
        currency: "USD",
        orderId: order.id,
        customerEmail: cart.user?.email,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: claims.sub,
        },
      })

      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: claims.sub,
          restaurantId: order.restaurantId,
          amount: pricing.charges.totalAmount,
          currency: "USD",
          status: "PENDING",
          method: "STRIPE",
          gateway: "STRIPE",
          gatewayOrderId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          transactionId: `TXN-${order.id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        },
      })

      return {
        status: "ok",
        message: "Payment initiated. Please confirm card payment to place your order.",
        requiresPayment: true,
        gateway: "STRIPE",
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: getStripePublishableKey(),
        amount: Math.round(pricing.charges.totalAmount * 100),
        currency: "USD",
        payment,
      }
    } catch (err: any) {
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to initiate Stripe payment: ${err?.message || "Internal error"}`,
      })
    }
  }
})
