-- Marlow shop: an order is shipped to an address or picked up at the shop, and its states say which.
--
-- Every order before this one shipped, so `delivery` starts as 'ship' for all of them. An order picked
-- up at the shop has no address, so the address columns allow null, and a check keeps them set together
-- with the delivery: all of them for an order that ships, none for one picked up.
--
-- The states get the names the client reads: 'picking' becomes 'preparing', 'ready' (packed, waiting)
-- becomes 'shipped' for a parcel and stays 'ready' for an order waiting at the counter, and 'completed'
-- becomes 'delivered' or 'picked-up'. Each update names the rows it changes; the check then allows each
-- delivery only its own track.
alter table public.orders
  add column delivery text not null default 'ship' check (delivery in ('ship', 'pickup'));

alter table public.orders
  alter column ship_line1 drop not null,
  alter column ship_city drop not null,
  alter column ship_postal_code drop not null,
  alter column ship_country drop not null;

alter table public.orders add constraint orders_delivery_address_check check (
  case delivery
    when 'ship' then ship_line1 is not null
      and ship_city is not null
      and ship_postal_code is not null
      and ship_country is not null
    else ship_line1 is null
      and ship_city is null
      and ship_region is null
      and ship_postal_code is null
      and ship_country is null
  end
);

-- Replaced below by the check that knows each delivery's track.
alter table public.orders drop constraint orders_fulfillment_check;

update public.orders set fulfillment = 'preparing' where fulfillment = 'picking';
update public.orders set fulfillment = 'shipped' where fulfillment = 'ready' and delivery = 'ship';
update public.orders set fulfillment = 'delivered' where fulfillment = 'completed';

alter table public.orders add constraint orders_fulfillment_check check (
  fulfillment in ('placed', 'preparing', 'cancelled')
  or (delivery = 'ship' and fulfillment in ('shipped', 'delivered'))
  or (delivery = 'pickup' and fulfillment in ('ready', 'picked-up'))
);
