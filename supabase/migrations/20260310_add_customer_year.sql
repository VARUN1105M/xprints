alter table public.customers
add column if not exists year text;

update public.customers
set year = coalesce(nullif(year, ''), 'I')
where year is null or year = '';

alter table public.customers
alter column year set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_year_check'
  ) then
    alter table public.customers
    add constraint customers_year_check check (year in ('I', 'II', 'III', 'IV'));
  end if;
end $$;
