# 📦 Inventory Management LIFF

**A mobile-first point-of-sale and inventory system for a small business, running inside the LINE app.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## At a Glance

| | |
|---|---|
| **What it is** | A full-stack web app that lets a shop owner record sales, track stock, and see profit in real time from their phone. |
| **Who it's for** | A real small business in Thailand that sells packaged goods, where staff already use LINE (Thailand's most popular messaging app) every day. |
| **Problem solved** | It replaces handwritten sales logs and spreadsheets, which caused stock miscounts and made profit hard to calculate. |
| **My role** | Sole developer. I gathered requirements, designed the database, built the API and UI, and handled deployment. |
| **Status** | In use. Deployed on Vercel with a managed PostgreSQL database. |

---

## Key Features

- **🛒 Fast order entry.** Pick a product, set a quantity, and choose a payment method (cash, QR scan, or the government "Thai Help Thai" co-payment scheme). The total is calculated instantly.
- **💰 Bundle promotions.** Supports deals like *"3 packs for ฿100"* and automatically mixes bundle and regular pricing (for example, 4 packs = ฿100 + ฿35).
- **📦 Stock control.** Stock is deducted on every sale and restored when an order is cancelled. The system never lets stock go negative, even when two orders arrive at the same moment.
- **📊 Sales dashboard.** Shows revenue, cost, profit, and margin for any date range, broken down by product and payment method, alongside live stock levels.
- **🧾 Accurate history.** Each order stores a snapshot of the price, cost, and promotion at the time of sale, so later price changes never rewrite past profit reports.
- **📱 Built for phones.** It opens inside LINE via LIFF (LINE Front-end Framework), so there is no separate app to install and no new account to create.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Lucide icons |
| Backend | Next.js Route Handlers (REST API), Zod validation |
| Database | PostgreSQL with the Prisma ORM and versioned migrations |
| Platform | LINE LIFF SDK for in-app login and user profile |
| DevOps | Vercel hosting, Docker Compose for local PostgreSQL |

---

## Architecture

```mermaid
flowchart LR
    U[Staff on LINE app] -->|LIFF| FE[Next.js React UI]
    FE -->|fetch JSON| API[Route Handlers<br/>/api/product · /api/order · /api/analytic]
    API --> C[Controllers<br/>request parsing + Zod validation]
    C --> S[Services<br/>business rules + transactions]
    S --> P[(PostgreSQL<br/>via Prisma)]
```

Each API resource follows a **Route → Controller → Service** layering:

- **Route** (`route.ts`) maps HTTP verbs to controller methods.
- **Controller** validates input with Zod and converts errors into consistent JSON responses with the correct HTTP status (400, 404, 409, or 500).
- **Service** holds the business logic and is the only layer that talks to the database.

---

## Engineering Highlights

### 1. Race-safe stock deduction
Creating an order runs inside a database transaction, and stock is decremented with a single conditional update:

```ts
// succeeds only if enough stock remains at write time
tx.product.updateMany({
  where: { id, stock_quantity: { gte: quantity } },
  data:  { stock_quantity: { decrement: quantity } },
})
```

If two staff members sell the last item at the same time, exactly one sale succeeds and the other gets a clear "Insufficient stock" error. Stock can never go negative.

### 2. Price snapshots for trustworthy reports
Each order stores `unit_cost`, `unit_price`, `selling_price`, and the promotion that applied. Profit reports use these stored values, so editing a product's price today does not change last month's numbers.

### 3. Single-round-trip analytics
The production database is reached through a connection pooler with a single connection over a high-latency link, so the number of round trips matters more than the query itself. The dashboard is computed in **one SQL statement** (CTE + `SUM` / `GROUP BY` / `json_agg`) instead of loading every order into memory or running several queries.

| | Before | After |
|---|---|---|
| DB round trips per request | 6 | 1 |
| Response time (single request) | ~4.8 s | ~0.8 s |
| 8 concurrent requests | 6 of 8 failed (pool timeout) | 8 of 8 succeeded |

### 4. Safe data lifecycle
Products that already have sales cannot be hard-deleted, because deleting them would erase sales history. They are **deactivated** instead, which hides them from the order screen while keeping all reports intact.

### 5. Consistent validation and error handling
A shared `HttpError` type and `toErrorResponse()` helper ([lib/http-error.ts](lib/http-error.ts)) map validation errors, business-rule errors, and Prisma constraint errors to the right HTTP status codes. Controllers do not need to match on error message text.

---

## Data Model

```mermaid
erDiagram
    PRODUCT ||--o{ ORDER : "has"
    PRODUCT {
        uuid id PK
        string name UK
        float purchase_price
        float selling_price
        int stock_quantity
        int promotion_quantity "bundle size, e.g. 3"
        float promotion_price "bundle price, e.g. 100"
        bool isActive
    }
    ORDER {
        uuid id PK
        uuid productID FK
        int quantity
        enum payment_method "CASH | SCAN | THAI_HELP"
        float unit_cost "snapshot"
        float unit_price "snapshot"
        float totalAmount
        float totalCost
        bool has_promotion
        bool isDelivery
        string note
        datetime createdAt
    }
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/product` | List products (`?isActive=true`, `?id=`, `?name=`) |
| `POST` | `/api/product` | Create a product |
| `PATCH` | `/api/product?id={id}` | Update a product |
| `PUT` | `/api/product?id={id}` | Toggle the product's active status |
| `DELETE` | `/api/product?id={id}` | Delete a product (only if it has no orders) |
| `GET` | `/api/order` | List orders (`?startDate=&endDate=` ISO 8601, `?id=`, `?productID=`) |
| `POST` | `/api/order` | Create an order (validates and deducts stock atomically) |
| `DELETE` | `/api/order?id={id}` | Cancel an order and restore its stock |
| `GET` | `/api/analytic` | Sales summary for a date range |
| `GET` | `/api/health` | Health check |

---

## Getting Started

### Prerequisites
- Node.js 20 or later
- Docker (for local PostgreSQL), or any PostgreSQL instance
- A LINE Developers account with a LIFF app (optional for local UI testing)

### Setup

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Start PostgreSQL locally
docker compose up -d db

# 3. Configure environment variables
cat > .env <<'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/pom_pe"
DIRECT_URL="postgresql://postgres:password@localhost:5432/pom_pe"
NEXT_PUBLIC_LIFF_ID="your-liff-id"
EOF

# 4. Apply migrations and seed sample data
npm run prisma:migrate
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open http://localhost:3000.

| Page | Path |
|---|---|
| New order | `/` |
| Sales dashboard | `/order` |
| Order history | `/order/manage` |
| Product management | `/product` |

---

## Project Structure

```
app/
├── api/
│   ├── analytic/      # Sales analytics (route → controller → service)
│   ├── order/         # Order CRUD + stock logic
│   ├── product/       # Product CRUD
│   └── health/        # Health check
├── components/        # Feature components + ui/ primitives
├── providers/         # LIFF context provider
├── hooks/             # useLiffUser
├── order/             # Dashboard and order-history pages
└── product/           # Product management page
lib/
├── prisma.ts          # Shared Prisma client
└── http-error.ts      # Error types, error → response mapping, date-range helpers
prisma/
├── schema.prisma      # Database schema
├── migrations/        # Versioned SQL migrations
└── seed.js            # Sample data
scripts/
└── backfill-order-cost.ts  # One-off data migration for legacy orders
```

---

## Roadmap

- [ ] Role-based access control using the verified LINE ID token on the server
- [ ] Export reports to Excel or PDF
- [ ] Low-stock alerts through the LINE Messaging API
- [ ] Automated tests for pricing and stock logic
- [ ] Store money as integer satang (or `Decimal`) instead of floating point

---

## Author

**Panupong** · Full-stack Developer
<!-- Add your links: GitHub · LinkedIn · Email -->
