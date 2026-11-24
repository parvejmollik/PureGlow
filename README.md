# PureGlow — Clean Skincare & Cosmetics Store

A responsive, full-featured e-commerce web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Firebase (Firestore & Authentication)**. Designed for clean beauty retail with prices in **Bangladeshi Taka (`৳`)**, live inventory management, multi-method checkout, real-time order tracking, notifications, and an operations admin dashboard.

---

## Key Features

### 1. Storefront & Product Discovery
- **Responsive Storefront**: Adapts cleanly across desktop, tablet, and mobile viewports.
- **Category Filtering & Search**: Filter across `Skincare`, `Makeup`, `Hair Care`, `Fragrance`, and `Body Care`, search by product name/SKU/description, and sort by Featured, Price, or Rating.
- **Product Quick View**: Inspect ingredients, size, live stock availability, and add custom quantities directly to the bag.

### 2. Shopping Cart & Multi-Option Checkout
- **Slide-Over Shopping Bag**: Adjust item quantities (clamped to available stock), remove items, and track progress toward the `৳50` free shipping threshold.
- **Promo Codes**: Supports `GLOW15` (15% off) and `WELCOME10` (10% off).
- **Payment Options**: Supports **Cash on Delivery (COD)**, **bKash**, **Nagad**, and **Credit/Debit Card**, with input validation and instant stock deduction upon order placement.

### 3. Order Tracking & Notification System
- **Live Order Tracking**: Look up any order by Order Number (e.g., `AB-1042`) or choose from recent orders to inspect a 4-stage fulfillment timeline (`Order Placed` → `Preparing` → `Shipped` → `Delivered`), itemized receipt, and shipping details. Customers can cancel orders while in `placed` status.
- **Order & Stock Notifications**: Notification center dropdown and live toast alerts notify customers of order confirmations and status changes, and alert administrators when orders arrive or SKU stock falls below threshold.

### 4. User Authentication & Admin Dashboard
- **Google Authentication**: Sign in via Firebase Auth (`signInWithPopup`) to sync orders, user profiles, and admin operations to Cloud Firestore.
- **Admin Operations Console**:
  - **Overview**: Gross revenue, active orders, total units in stock, and low-stock alert KPIs.
  - **Inventory & Stock Management**: Inline `-1` / `+1` / `+10` stock adjustments, low-stock filtering, and Add/Edit/Delete product modal.
  - **Orders & Fulfillment**: Filter orders by status and advance fulfillment stages (`Placed` → `Processing` → `Shipped` → `Delivered`) with automatic customer notifications.
- **Preview Fallback**: Deterministic seed data ensures storefront browsing, cart, checkout, tracking, and admin preview workflows remain testable even before signing in.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend / Database**: Firebase Authentication (Google Sign-In) & Cloud Firestore
- **Security & Testing**: `@firebase/eslint-plugin-security-rules`, Node built-in test runner (`node:test` + `tsx`)

---

## Project Structure

```text
├── firebase-blueprint.json   # Firestore entity & collection schema blueprint
├── firestore.rules           # Hardened Firestore security rules
├── firestore.rules.test.ts   # Security rules invariant checks
├── security_spec.md          # Security invariants & adversarial test spec
├── eslint.config.js          # ESLint config for Firestore security rules
├── index.html                # App entry HTML & typography imports
└── src/
    ├── components/           # Storefront, Header, CartDrawer, OrderTracking, AdminDashboard, AuthModal
    ├── context/              # StoreContext (Firebase Auth, Firestore listeners, cart & order actions)
    ├── data/                 # Seed products, orders, and notifications
    ├── lib/                  # Firebase SDK initialization & structured error handling
    ├── types/                # TypeScript domain types and field limits
    └── utils/                # Pure commerce logic + unit tests (commerce.ts / commerce.test.ts)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Firebase project with **Firestore** and **Google Authentication** enabled (configured in `firebase-applet-config.json`).

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Runs the app on `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

### Type Check, Tests & Security Rules Linting

```bash
# TypeScript type check
npm run lint

# Pure commerce & rules invariant unit tests
npx tsx --test src/utils/commerce.test.ts firestore.rules.test.ts

# Audit Firestore security rules with ESLint
npx eslint firestore.rules
```

---

## Database & Security Notes

- **Collections**: `/products`, `/users`, `/orders`, `/notifications`, and `/admins`.
- **Rules**: `firestore.rules` enforces default-deny, email verification on writes, schema/key allowlisting (`hasAll` / `hasOnly`), string length bounds, owner/admin PII isolation, and server-timestamp checks (`request.time`).
- **Admin Access**: Configure admin access in `firestore.rules` or via `/admins/{uid}` documents, and review `firestore.rules` thoroughly before deploying to production.
