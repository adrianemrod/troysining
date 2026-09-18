# Troysining Printing Management System

Internal operations platform for **Troysining Printing Services** (Philippines). Replaces manual, Facebook-Page-based client handling with a deadline-first collaboration tool for Admin/GM, Sales, Production, Delivery, and Encoder staff.

The centerpiece is the **post-login dashboard**: the first thing every user sees is what's overdue, what's due today, and what's currently in production — sorted by urgency and role-aware.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript, full-stack (pages + API routes in one codebase)
- **Styling:** Tailwind CSS v4, custom theme tokens (`--color-primary` navy `#1f3f5b`, `--color-accent` orange `#e08b2e`)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Custom JWT session in an httpOnly cookie (`jose` + `bcryptjs`), role-based access control enforced in `src/proxy.ts` (Next.js middleware) and inside every API route
- **File storage:** Local filesystem abstraction (`src/lib/storage.ts`), files organized per client under `storage/<clientId>/…`, served via an authenticated route (`/api/files/serve/...`) — swappable for S3 later
- **Drag & drop:** `@dnd-kit` for the production Kanban board
- **Icons:** `lucide-react`

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (or a `DATABASE_URL` pointing at one)

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/troysining?schema=public"
JWT_SECRET="change-this-to-a-long-random-string"
NEXT_PUBLIC_APP_NAME="Troysining Printing Management System"
```

Make sure the database exists:

```bash
createdb troysining   # or: psql -c "CREATE DATABASE troysining;"
```

## 3. Migrate the database

This project uses `prisma db push` (no migration history needed for local/dev use):

```bash
npm run db:push
```

## 4. Seed sample data

Seeds 7 users (one per role, two roles doubled up for realism), 12 catalog products, 17 clients, 14 job orders with a **deliberate mix of deadlines** — overdue, due today, due this week, due later, and already-delivered — and 12 sample expenses across several categories, so the dashboard and reports are demoable immediately.

```bash
npm run db:seed
```

Or reset + reseed in one step:

```bash
npm run db:reset
```

### Login credentials (all roles share the same password)

| Role | Email | Password |
|---|---|---|
| Admin / GM | `admin@troysining.ph` | `Troysining123!` |
| Sales | `sales@troysining.ph` | `Troysining123!` |
| Production | `production@troysining.ph` | `Troysining123!` |
| Delivery | `delivery@troysining.ph` | `Troysining123!` |
| Encoder / Staff | `encoder@troysining.ph` | `Troysining123!` |

(A second Sales and second Production user are also seeded — see `prisma/seed.ts` for the full list.)

## 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Other scripts

```bash
npm run build       # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run db:studio  # Prisma Studio (browse/edit data visually)
```

## Project structure

```
prisma/schema.prisma        Data model (Users, Clients, Orders, Production, Delivery, Files, Expenses, ActivityLog...)
prisma/seed.ts                    Demo data seed script
src/proxy.ts                        Auth + role-based route protection (Next.js middleware)
src/lib/                              Server utilities: auth, prisma client, storage, deadline logic, RBAC nav
src/app/(app)/                    Authenticated app shell + all modules (dashboard, crm, products, orders,
                                          production, delivery, files, admin)
src/app/api/                        REST API routes backing every module
src/components/                 Reusable UI (Card, Badge, Button...) + per-module components
storage/                              Local file storage root (created at runtime), one folder per client
```

## Notes on demo simplifications

- **No email provider is configured.** "Forgot password" and "Invite teammate" generate a real token/link in the database, but instead of emailing it, the link is returned directly in the API response (and logged to the server console) so you can test the full flow locally. Swap in a real mailer (e.g. Resend, SES) for production.
- **File storage is local disk** (`storage/`), organized per client, abstracted behind `src/lib/storage.ts` so it can be swapped for an S3-compatible bucket without touching call sites.
- Currency formatting is Philippine Peso (₱) and all dates/deadlines are computed in the `Asia/Manila` timezone regardless of server locale.

## Role-based access (RBAC)

| Area | Admin | Sales | Production | Delivery | Encoder |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ (all jobs) | ✅ (own clients) | ✅ (production queue) | ✅ (deliveries) | ✅ (view) |
| CRM | ✅ | ✅ | – | – | ✅ (view + notes) |
| Products | ✅ | ✅ | – | – | ✅ (view) |
| Sales & Orders (new/edit/delete) | ✅ | ✅ (own orders) | – | – | – |
| Production Tracker | ✅ | – | ✅ | – | – |
| Delivery Tracker | ✅ | – | – | ✅ | – |
| File Organizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expense Tracker (new/edit/delete) | ✅ | – | – | – | – |
| Admin (users/activity) | ✅ | – | – | – | – |
| Job order detail page | ✅ | ✅ | ✅ | ✅ | ✅ |

Access is enforced both in the UI (sidebar only shows permitted links) and at the route/API level (`src/proxy.ts` + per-route checks), so directly visiting a restricted URL redirects/`403`s rather than merely hiding a link.

## Recently added

- **Deadline-first dashboard, now clickable:** the Overdue / Due Today / In Production / Ready for Delivery (or Due This Week) stat tiles at the top of the dashboard jump straight to their section further down the page — no more hunting.
- **Expense Tracker** (`/expenses`, Admin only): log shop expenses (materials, rent, utilities, payroll, etc.) with full create/edit/delete, a monthly total, and a by-category breakdown.
- **Sales & Orders CRUD:** orders can now be edited (due date, downpayment, notes, and line items — the total recalculates automatically) or deleted, from both the orders list and the order detail page, in addition to being created.
