insert into public.inventory (item_name, category, quantity, unit, low_stock_limit)
values
  ('A4 Paper Bundle', 'Paper', 3000, 'sheets', 600),
  ('Black Ink Cartridge', 'Ink', 40, 'cartridges', 8),
  ('Color Ink Cartridge', 'Ink', 24, 'cartridges', 4),
  ('Binding Material', 'Binding', 180, 'sets', 24)
on conflict (item_name) do update
set
  category = excluded.category,
  quantity = excluded.quantity,
  unit = excluded.unit,
  low_stock_limit = excluded.low_stock_limit;
