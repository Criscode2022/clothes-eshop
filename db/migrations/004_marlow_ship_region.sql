-- Marlow shop: the state, province, or prefecture of the delivery address, where the country's addresses
-- name one (United States, Canada, Mexico, Brazil, Argentina, India, Japan, China). Null elsewhere and for
-- orders placed before it was asked. Adding a nullable column leaves every existing order as it was.
alter table public.orders add column ship_region text;
