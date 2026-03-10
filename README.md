# XPrints

XPrints is a web-based Xerox shop management system built for a college print shop that currently operates through Excel sheets. It tracks customers, multi-service orders, unpaid jobs, payments, department usage reports, and inventory deductions in one Supabase-backed dashboard.

## Stack

- Next.js 14 App Router
- Tailwind CSS
- shadcn-style UI primitives
- Supabase PostgreSQL + Supabase Auth
- Vercel deployment target

## Features

- Admin-only authentication through Supabase Auth plus an `ADMIN_EMAILS` allowlist
- Dashboard cards for today’s revenue, orders, copies, pending payments, and non-print service count
- New order flow with:
  - customer autosuggestions
  - multiple service rows in one order
  - conditional copies vs quantity inputs
  - suggested pricing
- Customer search, department filtering, and job history
- Unpaid jobs queue with payment capture
- Reports for department usage, other services usage, and daily revenue
- Excel export from the reports page
- Inventory tracking with manual adjustments
- Automatic inventory deduction in PostgreSQL when order items are inserted
- Realtime page refresh via Supabase subscriptions
- Global search for customers and orders
- Pagination on management pages

## Environment

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAILS=admin@example.com
```

## Supabase Setup

1. Create a Supabase project.
2. In SQL Editor, run [`supabase/schema.sql`](/C:/Users/vishv/Projects/XPrints/supabase/schema.sql).
3. Run [`supabase/seed.sql`](/C:/Users/vishv/Projects/XPrints/supabase/seed.sql) to load base inventory.
4. In Authentication, create the admin user account whose email is listed in `ADMIN_EMAILS`.
5. Enable realtime for `customers`, `orders`, `order_items`, `payments`, and `inventory` if your project has it disabled.

## Local Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run build
```

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables from `.env.local`.
4. Deploy.

## Notes

- The design uses a black-and-white palette with manual light/dark toggle.
- Payment status is stored at the order level and mirrored in payment entries.
- Inventory deduction logic lives in PostgreSQL triggers so it stays consistent regardless of client flow.
