-- Marlow shop: when a bank transfer arrived. Null until it does, and for the methods paid in person
-- (at the shop, or cash on delivery). Adding a nullable column leaves every existing order as it was.
alter table public.orders add column paid_at timestamptz;
