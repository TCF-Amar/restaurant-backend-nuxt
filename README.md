# 🍽️ Artisan Delivery & Multi-Tenant Restaurant Platform

> **Modern, full-stack multi-tenant restaurant management portal and food delivery engine built with Nuxt 4, Vue 3.5, Prisma ORM, PostgreSQL, Redis, and Tailwind CSS v4.**

---

## 🌟 Overview

The **Artisan Delivery Platform** provides a dual-interface architecture:
1. **Web Management Portal**: An ultra-luxury, dark glassmorphic dashboard for Super Admins, Restaurant Owners, and Kitchen Staff to manage outlets, categories, menu variants/addons, operational staff, and live incoming orders.
2. **High-Performance RESTful API**: OpenAPI-compliant backend powering customer mobile apps (Flutter / React Native) with persistent cart calculations, dynamic surcharge computation, and multi-gateway checkout.

---

## ✨ Key Features

### 🏢 Multi-Tenant Restaurant & Staff Management
- **Outlet Lifecycle**: Create and manage multiple restaurant outlets with custom slugs, banners, logos, and operating hours.
- **Granular Permissions**: Role-based access control with discrete permission flags:
  - `MANAGE_OUTLET`: Update store metadata, contact details, and status.
  - `MANAGE_CATEGORIES`: Create, edit, and reorder menu categories.
  - `MANAGE_MENU_ITEMS`: Manage dishes, pricing, variant groups, and addons.
  - `MANAGE_ORDERS`: Kitchen pipeline access to accept, prepare, and dispatch orders.
- **Global Super Admin Access**: Administrators (`ADMIN` role) automatically bypass restaurant-specific assignment checks to manage all outlets platform-wide.

### 🔐 Enterprise Authentication & Security
- **Multi-Factor Auth (MFA/2FA)**: Time-based One-Time Password (TOTP) generation with QR code setup and recovery codes.
- **Biometric Passkeys**: Passwordless login using WebAuthn / FIDO2 standards (`@simplewebauthn`).
- **OAuth 2.0**: Social authentication with Google and third-party identity providers.
- **Session Architecture**: Cryptographically signed JWT tokens (`jose`) delivered via HTTP-only cookies, with instant session invalidation backed by Redis.

### 🍔 Menu, Variant & Addon Engine
- **Hierarchical Categories**: Group items by culinary type with live search and filtering.
- **Flexible Variants**: Configure portion sizes (e.g. Regular, Large) with individual pricing.
- **Addon Groups**: Multi-selection extras (e.g. Extra Cheese, Sauces, Toppings) with independent price calculation.

### 💳 Cart, Dynamic Charges & Multi-Gateway Checkout
- **Persistent Server-Side Cart**: Automatically syncs across devices with real-time stock and pricing validation.
- **Dynamic Breakdown Engine**: Computes DB-verified subtotal, delivery fees, packaging charges, and tax.
- **Multi-Payment Gateways**:
  - **Cash on Delivery (COD)**: Zero-friction order placement straight to kitchen pipeline.
  - **Stripe**: Credit/Debit Cards, Apple Pay, and Google Pay via PaymentIntents and client secrets.
  - **Razorpay**: UPI (Google Pay, PhonePe, Paytm), NetBanking, and Cards with HMAC-SHA256 signature verification.
  - **Webhook Idempotency**: Fully logged webhooks (`payment_webhook_logs`) with replay attack prevention.

### 🎨 Glassmorphic Appearance & Theme Customizer
- **Dark Glassmorphism**: Tailored frosted glass components (`glass-card`, `glass-input`, `glass-header`) with subtle glowing chromatic accents.
- **Wallpaper Gallery**: Switch between 8 curated 3D liquid crystal wallpapers or supply a custom image URL:
  - *Liquid Chromatic Ribbon* (Default Ultra Luxury)
  - *Emerald Jade Luxury* (Emerald Gold)
  - *Sunset Amber & Magenta* (Sunset Warmth)
  - *Sapphire Cobalt Oceanic* (Neon Sapphire)
  - *Dark Obsidian Wave* (Dark Mode)
  - *Atmospheric Deep Violet* (Deep Focus)
  - *Prismatic Light Glass* (Light Accent)
  - *Cosmic Nebula Glass* (Cosmic)
- **Blur Radius Control**: Live slider to tune backdrop blur (0px – 32px) persisted in `localStorage`.
- **Responsive Layout**: Resizable and collapsible sidebar navigation with compact icon-rail mode.

### 📚 Interactive API Documentation
- Built-in OpenAPI specification powered by Nitro:
  - **Scalar Docs**: Available at [`/docs`](http://localhost:3000/docs)
  - **Swagger UI**: Available at [`/swagger`](http://localhost:3000/swagger)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [Nuxt 4](https://nuxt.com/) (Vue 3.5, Vue Router 5) |
| **State Management** | [Pinia 4](https://pinia.vuejs.org/) |
| **Styling & Icons** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Vue Next](https://lucide.dev/) |
| **ORM & Database** | [Prisma 7](https://www.prisma.io/), [PostgreSQL 17](https://www.postgresql.org/) |
| **Caching & Queues** | [Redis](https://redis.io/), [BullMQ](https://docs.bullmq.io/), [ioredis](https://github.com/redis/ioredis) |
| **Authentication** | [Jose](https://github.com/panva/jose), [SimpleWebAuthn](https://simplewebauthn.dev/), [OTPAuth](https://github.com/hectorm/otpauth), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Payments** | [Stripe](https://stripe.com/), [Razorpay](https://razorpay.com/) |
| **Runtime / Package Manager** | [Bun](https://bun.sh/) |

---

## 📁 Project Structure

```text
projet-1/
├── app/                        # Nuxt 4 Client Application
│   ├── assets/css/             # Tailwind CSS v4 & custom glassmorphism styles
│   ├── components/             # Reusable UI & Modal components
│   │   ├── categories/         # Category modals, hero, and cards
│   │   ├── restaurants/        # Restaurant management, staff assignment
│   │   ├── settings/           # Appearance, address, and profile tabs
│   │   └── ui/                 # Base glass inputs, badges, and controls
│   ├── composables/            # useAuth, useGlassSettings, useSidebar
│   ├── layouts/                # Default (with dynamic wallpaper) & Auth layouts
│   ├── pages/                  # Nuxt pages (restaurants, categories, settings, etc.)
│   └── stores/                 # Pinia stores (restaurants, cart, auth)
├── prisma/                     # Database layer
│   ├── migrations/             # SQL migration history
│   └── schema.prisma           # Prisma data models & relational schema
├── public/                     # Static assets & 3D wallpapers
│   └── images/                 # Wallpaper presets (cyber-glass, emerald, etc.)
├── server/                     # Nitro Backend Engine
│   ├── api/v1/                 # REST endpoints
│   │   ├── admin/              # User, role, and platform management
│   │   ├── auth/               # Passkeys, 2FA, OAuth, login, register, me
│   │   ├── cart/               # Cart management & checkout
│   │   ├── owner/              # Outlet-scoped management endpoints
│   │   ├── payments/           # Intent creation, signature verification, webhooks
│   │   └── restaurants/        # Restaurant catalog & details
│   ├── middleware/             # Auth session extraction & security headers
│   └── utils/                  # Prisma client, token helpers, RBAC guards
├── workers/                    # BullMQ async background queue workers
├── docs/                       # Architecture specifications & workflows
├── docker-compose.yml          # PostgreSQL 17 & Redis Stack container definitions
└── nuxt.config.ts              # Nuxt 4 configuration & OpenAPI definition
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **[Bun](https://bun.sh/)** (v1.1+ recommended) or Node.js (v20+)
- **[Docker Desktop](https://www.docker.com/)** (for PostgreSQL and Redis)

### 2. Clone & Install Dependencies

```bash
git clone <repository-url>
cd projet-1
bun install
```

### 3. Start Database & Redis Services

Launch PostgreSQL 17 and Redis Stack via Docker Compose:

```bash
docker compose up -d
```

Verify services:
- **PostgreSQL**: `localhost:5432` (User: `postgres`, Password: `postgres`, DB: `myapp_db`)
- **Redis Stack**: `localhost:6379` (Insight UI: `http://localhost:8001`)

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_db"
NUXT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_db"

# Redis Connection
NUXT_REDIS_URL="redis://localhost:6379"

# Security & Secrets
NUXT_JWT_SECRET="replace-with-a-secure-random-32-character-secret"

# Stripe (Optional for testing payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Razorpay (Optional for testing UPI / Indian payments)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

### 5. Apply Database Migrations & Generate Prisma Client

```bash
# Push schema changes to PostgreSQL
bun run db:push

# Generate Prisma Client
bunx prisma generate
```

### 6. Run the Application

```bash
# Start development server
bun run dev
```

The Web Management Portal will be live at:
👉 **`http://localhost:3000`**

To launch Prisma Studio for visual database inspection:
```bash
bun run db:std
```
Prisma Studio opens at `http://localhost:5555`.

### 7. Run Background Workers (Optional)

In a separate terminal window, start the BullMQ worker:

```bash
bun run worker:dev
```

---

## 📜 Available NPM / Bun Scripts

| Script | Command | Purpose |
|---|---|---|
| `bun run dev` | `nuxt dev` | Start development server with HMR |
| `bun run build` | `nuxt build` | Build production server bundle |
| `bun run preview` | `nuxt preview` | Locally preview production build |
| `bun run db:push` | `prisma db push` | Sync Prisma schema with database without migrations |
| `bun run db:mgr` | `prisma migrate dev` | Create and apply a new migration |
| `bun run db:deploy` | `prisma migrate deploy` | Apply pending migrations in production |
| `bun run db:status` | `prisma migrate status` | Check status of applied database migrations |
| `bun run db:std` | `prisma studio` | Launch web GUI for visual database management |
| `bun run worker` | `bun run workers/index.ts` | Run BullMQ background worker |
| `bun run worker:dev` | `bun --watch workers/index.ts` | Run worker with live auto-reload |

---

## 📖 Architecture & Design Documentation

For deep dives into internal architectures and workflows, explore the dedicated documentation guides:

- 💳 **[Order & Payment Architecture Flow](file:///c:/Users/DELL/Desktop/projet-1/docs/ORDER_PAYMENT_FLOW.md)**: Detailed breakdown of the persistent cart, dynamic surcharges, gateway state machines, webhooks, and client verification.
- 🎨 **[Glassmorphic Wallpaper Gallery](file:///C:/Users/DELL/.gemini/antigravity-ide/brain/74136bc4-f529-4a98-9d4e-f19831fd24da/wallpapers_collection.md)**: Color palettes, design aesthetics, and guides for the 8 custom 3D glassmorphic background wallpapers.

---

## 📄 License

Private & Proprietary. All rights reserved.
