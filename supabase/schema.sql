create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null check (department in ('IT', 'CSE', 'CSBS', 'ECE', 'CYBER', 'AIDS', 'EEE', 'CIVIL', 'MECH', 'BME', 'NIL')),
  year text not null check (year in ('I', 'II', 'III', 'IV')),
  section text not null check (section in ('A', 'B', 'NIL')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  total_price numeric(10, 2) not null default 0,
  payment_status text not null check (payment_status in ('paid', 'pending')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_type text not null check (service_type in ('B&W Print', 'Color Print', 'Front Page', 'Record Print', 'Binding', 'Report Printing', 'Report Rework')),
  service_category text not null check (service_category in ('printing', 'other')),
  unit_price numeric(10, 2) not null default 0,
  pages integer,
  copies integer,
  is_double_sided boolean default false,
  quantity integer,
  price numeric(10, 2) not null default 0,
  constraint copies_or_quantity_check check (
    (service_category = 'printing' and coalesce(pages, 0) > 0 and coalesce(copies, 0) > 0)
    or (service_category = 'other' and coalesce(quantity, 0) > 0)
  )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(10, 2) not null default 0,
  payment_method text not null check (payment_method in ('cash', 'upi', 'card', 'credit')),
  payment_status text not null check (payment_status in ('paid', 'pending')),
  payment_date timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null unique,
  category text not null,
  quantity numeric(12, 2) not null default 0,
  unit text not null,
  low_stock_limit numeric(12, 2) not null default 0
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  type text not null check (type in ('IN', 'OUT')),
  quantity numeric(12, 2) not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists customers_name_idx on public.customers using gin (to_tsvector('simple', name));
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists payments_status_idx on public.payments (payment_status);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "authenticated can manage customers" on public.customers;
create policy "authenticated can manage customers" on public.customers for all to authenticated using (true) with check (true);
drop policy if exists "authenticated can manage orders" on public.orders;
create policy "authenticated can manage orders" on public.orders for all to authenticated using (true) with check (true);
drop policy if exists "authenticated can manage order_items" on public.order_items;
create policy "authenticated can manage order_items" on public.order_items for all to authenticated using (true) with check (true);
drop policy if exists "authenticated can manage payments" on public.payments;
create policy "authenticated can manage payments" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "authenticated can manage inventory" on public.inventory;
create policy "authenticated can manage inventory" on public.inventory for all to authenticated using (true) with check (true);
drop policy if exists "authenticated can manage transactions" on public.transactions;
create policy "authenticated can manage transactions" on public.transactions for all to authenticated using (true) with check (true);

create or replace function public.handle_inventory_deduction()
returns trigger
language plpgsql
as $$
declare
  paper_item_id uuid;
  bw_ink_id uuid;
  color_ink_id uuid;
  binding_item_id uuid;
  paper_usage numeric := 0;
  ink_usage numeric := 0;
  binding_usage numeric := 0;
begin
  select id into paper_item_id from public.inventory where lower(item_name) = lower('A4 Paper Bundle') limit 1;
  select id into bw_ink_id from public.inventory where lower(item_name) = lower('Black Ink Cartridge') limit 1;
  select id into color_ink_id from public.inventory where lower(item_name) = lower('Color Ink Cartridge') limit 1;
  select id into binding_item_id from public.inventory where lower(item_name) = lower('Binding Material') limit 1;

  if new.service_category = 'printing' then
    paper_usage := greatest(
      coalesce(new.copies, 0) *
      case
        when coalesce(new.is_double_sided, false) then ceil(coalesce(new.pages, 0) / 2.0)
        else coalesce(new.pages, 0)
      end,
      0
    );
    if paper_item_id is not null and paper_usage > 0 then
      update public.inventory set quantity = quantity - paper_usage where id = paper_item_id;
      insert into public.transactions (inventory_id, type, quantity, reason)
      values (paper_item_id, 'OUT', paper_usage, concat('Order item deduction: ', new.service_type));
    end if;

    if new.service_type = 'Color Print' then
      ink_usage := ceil(greatest(paper_usage, 0) / 100.0);
      if color_ink_id is not null and ink_usage > 0 then
        update public.inventory set quantity = quantity - ink_usage where id = color_ink_id;
        insert into public.transactions (inventory_id, type, quantity, reason)
        values (color_ink_id, 'OUT', ink_usage, 'Color print ink usage');
      end if;
    else
      ink_usage := ceil(greatest(paper_usage, 0) / 150.0);
      if bw_ink_id is not null and ink_usage > 0 then
        update public.inventory set quantity = quantity - ink_usage where id = bw_ink_id;
        insert into public.transactions (inventory_id, type, quantity, reason)
        values (bw_ink_id, 'OUT', ink_usage, 'Black print ink usage');
      end if;
    end if;
  end if;

  if new.service_type = 'Binding' then
    binding_usage := greatest(coalesce(new.quantity, 0), 0);
    if binding_item_id is not null and binding_usage > 0 then
      update public.inventory set quantity = quantity - binding_usage where id = binding_item_id;
      insert into public.transactions (inventory_id, type, quantity, reason)
      values (binding_item_id, 'OUT', binding_usage, 'Binding material usage');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists order_item_inventory_deduction on public.order_items;
create trigger order_item_inventory_deduction
after insert on public.order_items
for each row
execute function public.handle_inventory_deduction();
