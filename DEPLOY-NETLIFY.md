# Netlify Deploy

## Important

This project is a Next.js App Router app with middleware and server-side behavior.
Do not drag the source folder into Netlify Drop.

Manual drag-and-drop deploys are for built output folders, and Netlify does not run a build command for those deploys.

## Correct way

1. Put the whole project in a Git repository.
2. Push it to GitHub.
3. In Netlify, choose `Add new site` -> `Import an existing project`.
4. Select the repository.
5. Netlify will use the settings from [netlify.toml](/C:/Users/vishv/Projects/XPrints/netlify.toml).

## Environment variables in Netlify

Add these in Netlify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`

Copy the values from your local `.env.local`.

## Supabase

Before deploying, make sure the SQL files have already been run in your Supabase project:

- [schema.sql](/C:/Users/vishv/Projects/XPrints/supabase/schema.sql)
- [20260310_add_customer_year.sql](/C:/Users/vishv/Projects/XPrints/supabase/migrations/20260310_add_customer_year.sql)
- [20260310_add_order_item_pages_and_double_sided.sql](/C:/Users/vishv/Projects/XPrints/supabase/migrations/20260310_add_order_item_pages_and_double_sided.sql)
- [20260310_add_order_item_unit_price.sql](/C:/Users/vishv/Projects/XPrints/supabase/migrations/20260310_add_order_item_unit_price.sql)

## After deploy

Open the deployed site URL and test:

- login
- create order
- orders page
- inventory page
