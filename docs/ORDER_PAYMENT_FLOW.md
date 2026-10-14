# 💳 Artisan Delivery Platform — Order & Payment Architecture Flow

Welcome to the definitive architecture documentation for the **Cart, Dynamic Charges, and Multi-Gateway Payment Engine** powering the **Flutter Mobile Customer App** and the **Web Management Portal**.

---

## 🏗️ 1. High-Level Flow Diagram

```
                                [ CUSTOMER MOBILE APP ]
                                           │
  1. Add Food to Cart                      ▼
  POST /api/v1/cart/items  ────────────────┼──► Validates restaurant, items, variants, addons
                                           │
  2. Fetch Cart & Live Breakdown           ▼
  GET /api/v1/cart         ────────────────┼──► DB-verified Subtotal, Delivery, Tax, Packaging, Total
                                           │
  3. Customer Initiates Checkout           ▼
  POST /api/v1/cart/checkout               │
                                           │
              ┌────────────────────────────┴────────────────────────────┐
              ▼                                                         ▼
     [ CASH ON DELIVERY ]                                      [ ONLINE: UPI / CARD ]
              │                                                         │
   • Order created in `PENDING`                               • Order created in `PAYMENT_PENDING`
   • Payment created in `PENDING`                             • Generates Gateway Credentials:
   • Cart wiped immediately in DB                                 - Razorpay Order ID (UPI apps)
   • Sent directly to Kitchen!                                    - Stripe Client Secret (Cards)
                                                              • Cart preserved until payment success
                                                                        │
                                                                        ▼
                                                              [ Customer Authorizes ]
                                                              • UPI PIN (GPay/PhonePe/Paytm)
                                                              • 3DS Card OTP / Apple Pay
                                                                        │
                                                                        ▼
                                                              [ Mobile Client Verification ]
                                                              POST /api/v1/payments/verify
                                                              • Validates HMAC-SHA256 signature
                                                                        │
                                                    ┌───────────────────┴───────────────────┐
                                                    ▼                                       ▼
                                              [ SUCCESS ]                              [ FAILED ]
                                            • Order: `ACCEPTED`                      • Order stays `PAYMENT_PENDING`
                                            • Payment: `COMPLETED`                   • Cart preserved for retry
                                            • Cart wiped in DB!                      • Error returned to user
                                            • Dispatched to Kitchen!
                                                    ▲
                                                    │ (Network Loss Fallback)
                                         [ Webhook Handlers ]
                                         • POST /api/v1/payments/webhooks/razorpay
                                         • POST /api/v1/payments/webhooks/stripe
```

---

## 🛒 2. Cart Management & Dynamic Pricing

### Cart Business Rules
1. **Single-Restaurant Isolation**: A cart can only contain dishes from a single restaurant at any time. Adding a dish from a new restaurant triggers a `409 Conflict` prompting the user to either cancel or force-reset the cart.
2. **Server-Side Price Authority**: Item prices, variants, and addons are never trusted from client inputs. They are queried and calculated live from PostgreSQL.
3. **Automated Charge Calculation**:
   - **Subtotal**: Sum of `(basePrice / variantPrice + addons) * quantity`.
   - **Delivery Fee**: Free delivery threshold applies (e.g. Orders $\ge$ ₹500 get Free Delivery; otherwise standard flat delivery fee ₹40 / $2.99).
   - **Packaging Fee**: Flat restaurant sanitary packaging charge (₹20 / $1.00).
   - **Tax / GST**: 5% standard food & beverage tax.
   - **Grand Total**: `subtotal + deliveryFee + packagingFee + taxAmount - discountAmount`.

---

## ⚡ 3. Detailed Checkout Scenarios

### Scenario A: Cash on Delivery (COD)
- **Initiation**: Client calls `POST /api/v1/cart/checkout` with `paymentMethod: "CASH_ON_DELIVERY"`.
- **Order State**: `OrderStatus.PENDING`.
- **Payment State**: `PaymentStatus.PENDING`, `method: "CASH_ON_DELIVERY"`.
- **Cart Action**: Cart items are instantly deleted.
- **Fulfillment**: Order is dispatched immediately to the restaurant's live kitchen screen.

### Scenario B: UPI Instant (Google Pay, PhonePe, Paytm via Razorpay)
1. **Initiation**: Client calls `POST /api/v1/cart/checkout` with `paymentMethod: "UPI"` or `"RAZORPAY"`.
2. **Pending Placement**:
   - The backend records the order with `OrderStatus.PAYMENT_PENDING`.
   - The backend creates an order on Razorpay servers (`rzpOrder = razorpay.orders.create({ amount, currency: "INR" })`).
   - The backend creates a pending `Payment` record with `gatewayOrderId: rzpOrder.id`.
   - Returns `{ requiresPayment: true, gateway: "RAZORPAY", razorpayOrderId, keyId, amount, customer }`.
3. **Client-Side Payment**:
   - The Flutter App opens Razorpay Standard Checkout / UPI intent.
   - The customer enters their 4-digit or 6-digit UPI PIN in Google Pay, PhonePe, or Paytm.
4. **Instant Verification Callback**:
   - The Flutter App receives the Razorpay signature callback and calls:
     ```http
     POST /api/v1/payments/verify
     {
       "orderId": "ord_123",
       "gateway": "RAZORPAY",
       "razorpayOrderId": "order_abc",
       "razorpayPaymentId": "pay_xyz",
       "razorpaySignature": "hmac_signature"
     }
     ```
   - The backend verifies HMAC-SHA256:
     $$\text{HMAC-SHA256}(\text{order\_id} \parallel \text{payment\_id}, \text{RAZORPAY\_SECRET}) == \text{signature}$$
   - **On Success**:
     - `order.status` moves from `PAYMENT_PENDING` ➔ `ACCEPTED`.
     - `payment.status` moves to `COMPLETED`.
     - The user's cart is wiped from the database.
     - Kitchen is notified to prepare food.
   - **On Failure**:
     - Signature rejected. Order remains unconfirmed. Cart is preserved so user can retry.

### Scenario C: Debit / Credit Card & Apple/Google Pay (Stripe)
1. **Initiation**: Client calls `POST /api/v1/cart/checkout` with `paymentMethod: "CARD"` or `"STRIPE"`.
2. **Pending Intent**:
   - The backend records the order with `OrderStatus.PAYMENT_PENDING`.
   - The backend creates a Stripe PaymentIntent (`stripe.paymentIntents.create({ amount, currency: "USD" })`).
   - Returns `{ requiresPayment: true, gateway: "STRIPE", paymentIntentId, clientSecret, publishableKey }`.
3. **Client-Side PaymentSheet**:
   - The Flutter App initializes `Stripe.instance.initPaymentSheet(clientSecret)`.
   - Customer completes 3DS Card authentication.
4. **Verification**:
   - The Flutter App calls `POST /api/v1/payments/verify` with `{ orderId, gateway: "STRIPE", paymentIntentId }`.
   - The backend queries Stripe API to guarantee `status === 'succeeded'`.
   - On confirmation, advances `order.status` to `ACCEPTED`, sets `payment.status` to `COMPLETED`, and clears the cart.

---

## 🛡️ 4. Asynchronous Webhooks (Tamper-Proof Safety Net)

In mobile environments, customers might lose network connectivity immediately after their bank approves the payment, closing the app before `POST /api/v1/payments/verify` finishes.

Our platform has automated server-to-server webhooks:
- **`POST /api/v1/payments/webhooks/razorpay`**:
  - Validates `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`.
  - On `order.paid` or `payment.captured`:
    - Finds payment by `gatewayOrderId`.
    - Atomically updates order to `ACCEPTED` and payment to `COMPLETED`.
    - Automatically wipes the customer's cart in the DB!
- **`POST /api/v1/payments/webhooks/stripe`**:
  - Validates `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`.
  - On `payment_intent.succeeded`:
    - Atomically promotes order to `ACCEPTED`, payment to `COMPLETED`, and clears the cart.

---

## 📚 5. Complete API Endpoints Cheatsheet

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/cart/items` | `POST` | Bearer | Add or increment item with variant, addons, notes |
| `/api/v1/cart` | `GET` | Bearer | Get user cart + calculated fees (subtotal, delivery, packaging, tax, total) |
| `/api/v1/cart/items/:id` | `PATCH` | Bearer | Update item quantity or special notes (quantity 0 removes item) |
| `/api/v1/cart/items/:id` | `DELETE` | Bearer | Delete specific item from cart |
| `/api/v1/cart` | `DELETE` | Bearer | Empty whole cart |
| `/api/v1/cart/calculate` | `POST` | None/Bearer | Live preview prices & charges breakdown for arbitrary item lists |
| `/api/v1/cart/checkout` | `POST` | Bearer | Checkout: instant placement for COD or intent generation for UPI/Cards |
| `/api/v1/payments/create-intent` | `POST` | Bearer | Generate Razorpay Order or Stripe PaymentIntent for an order |
| `/api/v1/payments/verify` | `POST` | Bearer | Cryptographically verify payment signature & transition order to kitchen |
| `/api/v1/payments/webhooks/razorpay` | `POST` | Webhook Sig | Authoritative Razorpay asynchronous fulfillment webhook |
| `/api/v1/payments/webhooks/stripe` | `POST` | Webhook Sig | Authoritative Stripe asynchronous fulfillment webhook |
| `/api/v1/payments` | `GET` | Bearer (Staff) | Admin & restaurant owner payments ledger with search & filters |
| `/api/v1/payments/:id/status` | `PATCH` | Bearer (Staff) | Modify payment status or issue refund with reason note |

---

## 📱 6. Flutter Mobile App Integration Example

### Razorpay UPI Checkout (Dart)
```dart
import 'package:razorpay_flutter/razorpay_flutter.dart';

void startCheckout(Map<String, dynamic> checkoutData) {
  Razorpay razorpay = Razorpay();

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) async {
    // 1. Send verification to backend
    final res = await http.post(
      Uri.parse('https://your-api.com/api/v1/payments/verify'),
      headers: {'Authorization': 'Bearer $userToken', 'Content-Type': 'application/json'},
      body: jsonEncode({
        'orderId': checkoutData['orderId'],
        'gateway': 'RAZORPAY',
        'razorpayOrderId': response.orderId,
        'razorpayPaymentId': response.paymentId,
        'razorpaySignature': response.signature,
      }),
    );
    // 2. Order confirmed! Navigate to Order Tracking screen
  });

  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
    // Show error toast; Cart remains intact so user can retry!
  });

  // Open native UPI chooser (Google Pay / PhonePe / Paytm / Cards)
  razorpay.open({
    'key': checkoutData['keyId'],
    'order_id': checkoutData['razorpayOrderId'],
    'amount': checkoutData['amount'],
    'name': checkoutData['businessName'],
    'currency': checkoutData['currency'],
    'prefill': {
      'contact': checkoutData['customer']['phone'],
      'email': checkoutData['customer']['email'],
    },
  });
}
```
