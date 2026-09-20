# Troysining Printing Management System

Internal operations platform for **Troysining Printing Services** (Philippines). Replaces manual, Facebook-Page-based client handling with a deadline-first collaboration tool for Admin/GM, Sales, Production, Delivery, and Encoder staff.

The centerpiece is the **post-login dashboard**: the first thing every user sees is what's overdue, what's due today, and what's currently in production — sorted by urgency and role-aware.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript, full-stack (pages + API routes in one codebase)
- **Styling:** Tailwind CSS v4, custom theme tokens (`--color-primary` navy `#1f3f5b`, `--color-accent` orange `#e08b2e`)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Custom JWT session in an httpOnly cookie (`jose` + `bcryptjs`), role-based access control enforced in `src/proxy.ts` (Next.js middleware) and inside every API route
- **File storage:** Local filesystem abstraction (`src/lib/storage.ts`), files organized per client under `storage/<clientId>/…` (override the root with the `STORAGE_ROOT` env var), served via an authenticated route (`/api/files/serve/...`) — swappable for S3 later
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

## Deploying so your team can use it

Running `npm run dev` only serves the app on your own machine — to give your team a real, shared web address, deploy it to a host with (a) a persistent disk, since uploaded files live on disk under `storage/`, and (b) a Postgres database. **[Railway](https://railway.app)** is the easiest fit — it bundles all three (app, Postgres, persistent volume) in one place with a "deploy from GitHub" flow. (If you'd rather use Vercel, it works for the app + a hosted Postgres like Neon, but you'd need to swap `src/lib/storage.ts` for S3-compatible storage first, since Vercel's filesystem isn't persistent — happy to do that swap if you go that route.)

Only you can do the account sign-up itself (that needs your own login/OAuth), but every step is quick:

1. **Sign up at [railway.app](https://railway.app)** — "Login with GitHub" is one click, no credit card needed for the trial.
2. **New Project → Deploy from GitHub repo** → pick `adrianemrod/troysining` → branch `claude/troysining-printing-system-9ru0ss` (or `main`, once this is merged).
3. **Add a database:** in the same project, click **+ New → Database → Add PostgreSQL**. Railway wires up its `DATABASE_URL` automatically — reference it in your app service's variables as `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
4. **Add a persistent volume** on the app service (Settings → Volumes → New Volume), mount path `/app/storage`. Then add an app variable `STORAGE_ROOT = /app/storage` so uploads always land on that volume.
5. **Add the remaining variables** on the app service:
   - `JWT_SECRET` — any long random string (e.g. generate one with `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_NAME` — `Troysining Printing Management System`
6. **Deploy.** Railway runs `npm install` (which now also runs `prisma generate` automatically), `npm run build`, then `npm run start`.
7. **Get your link:** Settings → Networking → Generate Domain. Railway gives you a public URL like `https://troysining-production.up.railway.app`.
8. **Add one more variable — this one matters:** `APP_URL = https://<the domain from step 7>`. Without this, links the app builds for you (team invites, password resets) resolve to Railway's *internal* address instead of your real domain and won't work for anyone outside the container. Setting `APP_URL` explicitly is what fixes that.
9. **Set up the database once:** open the app service's **Console** tab in Railway (or run these from your own machine with `DATABASE_URL` set to the Railway database's connection string) and run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

That URL from step 7 is the address you send your team — from here on, follow the invite steps in [Recently added](#recently-added) / the Admin panel to bring them in.

Every future `git push` to the connected branch auto-redeploys — no need to repeat these steps.

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
| CRM (new/edit/delete, quotation upload) | ✅ | ✅ (own clients) | – | – | ✅ (view + notes) |
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
- **CRM CRUD:** clients can now be edited or deleted from the client detail page (Sales users are scoped to their own clients).
- **Monthly trend charts + drill-down stat tiles**, on both Sales & Orders and Expenses:
  - The "Sales/Expenses This Month" *amount* tile links to a dedicated `/orders/analytics` or `/expenses/analytics` page with a 12-month bar chart, average-per-month, and a month-by-month table (Prisma has no server-side date-trunc across DBs, so months are bucketed in Manila time in application code).
  - The "Orders/Expenses This Month" *count* tile links back to the list, pre-filtered to the current month via a `?month=YYYY-MM` query param, scrolled straight to the table.
  - The "Total Orders" / "All-Time Total" tile links to the same table with no filter applied.
- **Quotation uploads on the client page:** `/crm/[id]` now has an inline file upload (defaulting to a new "Quotation" file category) and a thumbnail grid of everything uploaded for that client, in addition to the full File Organizer.
