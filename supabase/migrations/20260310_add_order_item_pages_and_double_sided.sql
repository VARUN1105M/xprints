alter table public.order_items
add column if not exists pages integer;

alter table public.order_items
add column if not exists is_double_sided boolean default false;

update public.order_items
set pages = coalesce(nullif(pages, 0), 1)
where service_category = 'printing' and (pages is null or pages = 0);

update public.order_items
set is_double_sided = coalesce(is_double_sided, false)
where service_category = 'printing' and is_double_sided is null;

alter table public.order_items
drop constraint if exists copies_or_quantity_check;

alter table public.order_items
add constraint copies_or_quantity_check check (
  (service_category = 'printing' and coalesce(pages, 0) > 0 and coalesce(copies, 0) > 0)
  or (service_category = 'other' and coalesce(quantity, 0) > 0)
);

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
