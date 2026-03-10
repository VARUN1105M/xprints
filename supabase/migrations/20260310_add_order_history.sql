alter table public.orders
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_reason text;

create table if not exists public.order_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  action text not null check (action in ('created', 'edited', 'deleted', 'payment_updated')),
  reason text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_history_order_idx on public.order_history (order_id, created_at desc);

alter table public.order_history enable row level security;

drop policy if exists "authenticated can manage order_history" on public.order_history;
create policy "authenticated can manage order_history" on public.order_history for all to authenticated using (true) with check (true);
