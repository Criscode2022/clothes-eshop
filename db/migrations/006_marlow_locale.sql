-- The language a person was using, so a later email can speak it.
--
-- An order keeps the language of the checkout that placed it: the progress email goes out days later,
-- when the desk marks it shipped or ready, and the browser is no longer in the request.
-- A profile keeps the language of the signed-in person, or of the last password reset they asked for,
-- because Neon Auth's email webhook does not see the shop's cookie.
-- Rows from before this column existed are English.

alter table public.profiles
  add column locale text not null default 'en' check (locale in ('en', 'es'));

alter table public.orders
  add column locale text not null default 'en' check (locale in ('en', 'es'));
