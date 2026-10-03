-- Marlow shop: public catalog, client-owned orders, and staff roles in app_private.
-- Run as one transaction on a non-production branch, as the project owner role,
-- after Neon Auth and the Data API are enabled.
-- Guest orders are inserted by the Node server (the table owner role). Anonymous
-- receives no write grant, so a guest cannot insert through the Data API.

create schema app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create type app_private.app_role as enum ('owner', 'worker');

create table app_private.user_roles (
  user_id uuid not null references neon_auth.user (id) on delete cascade,
  role app_private.app_role not null,
  primary key (user_id, role)
);

create function app_private.has_role(wanted app_private.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app_private.user_roles
    where user_id = (select auth.uid()) and role = wanted
  );
$$;

revoke all on function app_private.has_role(app_private.app_role) from public;
grant execute on function app_private.has_role(app_private.app_role) to authenticated;

create table public.profiles (
  id uuid primary key references neon_auth.user (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create function app_private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.name, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function app_private.create_profile() from public;

create trigger create_profile_after_sign_up
  after insert on neon_auth.user
  for each row execute function app_private.create_profile();

insert into public.profiles (id, display_name)
select id, coalesce(name, '')
from neon_auth.user
on conflict (id) do nothing;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price_cents integer not null check (price_cents > 0),
  summary text not null,
  created_at timestamptz not null default now()
);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  color text not null,
  stock integer not null check (stock >= 0),
  unique (product_id, size, color)
);
create index variants_product_id_idx on public.variants (product_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_id uuid references neon_auth.user (id),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  ship_line1 text not null,
  ship_city text not null,
  ship_postal_code text not null,
  ship_country text not null,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  payment_method text not null check (payment_method in ('shop-floor', 'bank-transfer', 'cash-on-delivery')),
  fulfillment text not null check (fulfillment in ('placed', 'picking', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index orders_client_id_idx on public.orders (client_id);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_name text not null,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  line_cents integer not null
);
create index order_lines_order_id_idx on public.order_lines (order_id);

revoke all on public.profiles, public.products, public.variants, public.orders, public.order_lines from authenticated, anonymous;

grant select, update on public.profiles to authenticated;
grant select on public.products, public.variants to anonymous, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, delete on public.variants to authenticated;
grant update (stock) on public.variants to authenticated;
grant select on public.orders, public.order_lines to authenticated;
grant update (fulfillment) on public.orders to authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select app_private.has_role('owner'))
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select app_private.has_role('owner')))
  with check (id = (select auth.uid()) or (select app_private.has_role('owner')));

create policy products_select on public.products
  for select to authenticated, anonymous
  using (true);

create policy products_insert on public.products
  for insert to authenticated
  with check ((select app_private.has_role('owner')));

create policy products_update on public.products
  for update to authenticated
  using ((select app_private.has_role('owner')))
  with check ((select app_private.has_role('owner')));

create policy products_delete on public.products
  for delete to authenticated
  using ((select app_private.has_role('owner')));

create policy variants_select on public.variants
  for select to authenticated, anonymous
  using (true);

create policy variants_insert on public.variants
  for insert to authenticated
  with check ((select app_private.has_role('owner')));

create policy variants_update on public.variants
  for update to authenticated
  using (
    (select app_private.has_role('worker'))
    or (select app_private.has_role('owner'))
  )
  with check (
    (select app_private.has_role('worker'))
    or (select app_private.has_role('owner'))
  );

create policy variants_delete on public.variants
  for delete to authenticated
  using ((select app_private.has_role('owner')));

create policy orders_select on public.orders
  for select to authenticated
  using (
    client_id = (select auth.uid())
    or (select app_private.has_role('worker'))
    or (select app_private.has_role('owner'))
  );

create policy orders_update on public.orders
  for update to authenticated
  using (
    (select app_private.has_role('worker'))
    or (select app_private.has_role('owner'))
  )
  with check (
    (select app_private.has_role('worker'))
    or (select app_private.has_role('owner'))
  );

create policy order_lines_select on public.order_lines
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders as shop_order
      where shop_order.id = order_id
    )
  );

create function public.current_shop_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select app_private.has_role('owner')) then 'owner'
    when (select app_private.has_role('worker')) then 'worker'
    else 'client'
  end;
$$;

create function public.set_product_price(target_product uuid, next_price integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select app_private.has_role('owner')) then
    raise exception 'Only the owner can change a price' using errcode = '42501';
  end if;
  update public.products
  set price_cents = next_price
  where id = target_product;
end;
$$;

create function public.set_variant_stock(target_variant uuid, next_stock integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not ((select app_private.has_role('worker')) or (select app_private.has_role('owner'))) then
    raise exception 'Only shop staff can change stock' using errcode = '42501';
  end if;
  update public.variants
  set stock = next_stock
  where id = target_variant;
end;
$$;

revoke all on function public.current_shop_role() from public;
revoke all on function public.set_product_price(uuid, integer) from public;
revoke all on function public.set_variant_stock(uuid, integer) from public;
grant execute on function public.current_shop_role() to authenticated;
grant execute on function public.set_product_price(uuid, integer) to authenticated;
grant execute on function public.set_variant_stock(uuid, integer) to authenticated;

insert into public.products (id, name, category, price_cents, summary) values
  ('11111111-1111-4111-8111-111111111111', 'Charcoal Wool Overcoat', 'outerwear', 42000, 'A heavy wool coat, cut long, with a horn button and a full lining.'),
  ('11111111-1111-4111-8111-111111111112', 'Camel Field Jacket', 'outerwear', 26800, 'Cotton twill, unlined, with a throat latch and deep pockets.'),
  ('11111111-1111-4111-8111-111111111113', 'Merino Crew Neck', 'knitwear', 9800, 'Fine merino, knitted tight enough to sit under a jacket.'),
  ('11111111-1111-4111-8111-111111111114', 'Ribbed Cardigan', 'knitwear', 14800, 'A long rib, oat yarn, with horn buttons and a patch pocket.'),
  ('11111111-1111-4111-8111-111111111115', 'Pleated Wool Trouser', 'trousers', 18600, 'A single forward pleat, full through the thigh, plain hem.'),
  ('11111111-1111-4111-8111-111111111116', 'Wide Cotton Trouser', 'trousers', 15400, 'Stone cotton with a wide leg and a flat front.'),
  ('11111111-1111-4111-8111-111111111117', 'Oxford Cloth Shirt', 'shirts', 8900, 'White oxford, button-down collar, a workroom staple.'),
  ('11111111-1111-4111-8111-111111111118', 'Silk Tunic', 'shirts', 17600, 'Ivory silk, dropped shoulder, meant to be worn untucked.');

insert into public.variants (product_id, size, color, stock) values
  ('11111111-1111-4111-8111-111111111111', '46', 'Charcoal', 4),
  ('11111111-1111-4111-8111-111111111111', '48', 'Charcoal', 2),
  ('11111111-1111-4111-8111-111111111111', '50', 'Camel', 3),
  ('11111111-1111-4111-8111-111111111112', '46', 'Camel', 5),
  ('11111111-1111-4111-8111-111111111112', '48', 'Camel', 1),
  ('11111111-1111-4111-8111-111111111113', 'S', 'Ink', 6),
  ('11111111-1111-4111-8111-111111111113', 'M', 'Ink', 6),
  ('11111111-1111-4111-8111-111111111113', 'L', 'Ink', 0),
  ('11111111-1111-4111-8111-111111111117', 'S', 'White', 2),
  ('11111111-1111-4111-8111-111111111118', 'S', 'Ivory', 3);
