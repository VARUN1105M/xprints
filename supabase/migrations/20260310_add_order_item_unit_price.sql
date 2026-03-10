alter table public.order_items
add column if not exists unit_price numeric(10, 2) not null default 0;

update public.order_items
set unit_price = coalesce(unit_price, price, 0)
where unit_price = 0;
