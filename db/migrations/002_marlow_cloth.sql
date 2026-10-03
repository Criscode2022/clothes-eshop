-- Cloth notes and stable slugs for the floor.
-- Additive only. Anonymous stays select-only. Guest orders are still inserted by the table owner.
-- No new grants.

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists composition text not null default '';
alter table public.products add column if not exists care text not null default '';
alter table public.variants add column if not exists slug text;

update public.products set
  slug = 'wool-overcoat',
  composition = '100% wool melton, cupro lining.',
  care = 'Brush and air it. Press with a cloth. Dry clean when the lining dulls.'
where id = '11111111-1111-4111-8111-111111111111';

update public.products set
  slug = 'field-jacket',
  composition = 'Cotton twill, unlined.',
  care = 'Cold wash, hang dry, and press the collar flat.'
where id = '11111111-1111-4111-8111-111111111112';

update public.products set
  slug = 'merino-crew',
  composition = 'Extrafine merino wool.',
  care = 'Hand wash cold and dry flat. Do not tumble.'
where id = '11111111-1111-4111-8111-111111111113';

update public.products set
  slug = 'ribbed-cardigan',
  composition = 'Wool and cotton rib.',
  care = 'Hand wash cold, reshape the rib, and dry flat.'
where id = '11111111-1111-4111-8111-111111111114';

update public.products set
  slug = 'pleated-trouser',
  composition = 'Wool twill.',
  care = 'Steam the pleat from the inside. Dry clean.'
where id = '11111111-1111-4111-8111-111111111115';

update public.products set
  slug = 'wide-trouser',
  composition = 'Washed cotton.',
  care = 'Machine wash cold and hang dry. Press a crease only if you want one.'
where id = '11111111-1111-4111-8111-111111111116';

update public.products set
  slug = 'oxford-shirt',
  composition = 'Oxford cotton cloth.',
  care = 'Machine wash warm, hang dry, and press the collar while it is damp.'
where id = '11111111-1111-4111-8111-111111111117';

update public.products set
  slug = 'silk-tunic',
  composition = 'Silk twill.',
  care = 'Dry clean. Steam from the inside.'
where id = '11111111-1111-4111-8111-111111111118';

update public.variants set slug = 'wool-overcoat-46-charcoal'
where product_id = '11111111-1111-4111-8111-111111111111' and size = '46' and color = 'Charcoal';
update public.variants set slug = 'wool-overcoat-48-charcoal'
where product_id = '11111111-1111-4111-8111-111111111111' and size = '48' and color = 'Charcoal';
update public.variants set slug = 'wool-overcoat-50-camel'
where product_id = '11111111-1111-4111-8111-111111111111' and size = '50' and color = 'Camel';
update public.variants set slug = 'field-jacket-46-camel'
where product_id = '11111111-1111-4111-8111-111111111112' and size = '46' and color = 'Camel';
update public.variants set slug = 'field-jacket-48-camel'
where product_id = '11111111-1111-4111-8111-111111111112' and size = '48' and color = 'Camel';
update public.variants set slug = 'merino-crew-s-ink'
where product_id = '11111111-1111-4111-8111-111111111113' and size = 'S' and color = 'Ink';
update public.variants set slug = 'merino-crew-m-ink'
where product_id = '11111111-1111-4111-8111-111111111113' and size = 'M' and color = 'Ink';
update public.variants set slug = 'merino-crew-l-ink'
where product_id = '11111111-1111-4111-8111-111111111113' and size = 'L' and color = 'Ink';
update public.variants set slug = 'oxford-shirt-s-white'
where product_id = '11111111-1111-4111-8111-111111111117' and size = 'S' and color = 'White';
update public.variants set slug = 'silk-tunic-s-ivory'
where product_id = '11111111-1111-4111-8111-111111111118' and size = 'S' and color = 'Ivory';

insert into public.variants (product_id, size, color, stock, slug)
select seed.product_id, seed.size, seed.color, seed.stock, seed.slug
from (
  values
    ('11111111-1111-4111-8111-111111111114'::uuid, 'S', 'Oat', 3, 'ribbed-cardigan-s-oat'),
    ('11111111-1111-4111-8111-111111111114'::uuid, 'M', 'Oat', 3, 'ribbed-cardigan-m-oat'),
    ('11111111-1111-4111-8111-111111111114'::uuid, 'L', 'Oat', 2, 'ribbed-cardigan-l-oat'),
    ('11111111-1111-4111-8111-111111111115'::uuid, '46', 'Charcoal', 4, 'pleated-trouser-46-charcoal'),
    ('11111111-1111-4111-8111-111111111115'::uuid, '48', 'Charcoal', 4, 'pleated-trouser-48-charcoal'),
    ('11111111-1111-4111-8111-111111111115'::uuid, '50', 'Charcoal', 2, 'pleated-trouser-50-charcoal'),
    ('11111111-1111-4111-8111-111111111116'::uuid, '46', 'Stone', 5, 'wide-trouser-46-stone'),
    ('11111111-1111-4111-8111-111111111116'::uuid, '48', 'Stone', 5, 'wide-trouser-48-stone'),
    ('11111111-1111-4111-8111-111111111117'::uuid, 'M', 'White', 8, 'oxford-shirt-m-white'),
    ('11111111-1111-4111-8111-111111111117'::uuid, 'L', 'White', 4, 'oxford-shirt-l-white'),
    ('11111111-1111-4111-8111-111111111118'::uuid, 'M', 'Ivory', 3, 'silk-tunic-m-ivory')
) as seed(product_id, size, color, stock, slug)
where not exists (
  select 1
  from public.variants as existing
  where existing.slug = seed.slug
     or (existing.product_id = seed.product_id and existing.size = seed.size and existing.color = seed.color)
);

create unique index if not exists products_slug_key on public.products (slug);
create unique index if not exists variants_slug_key on public.variants (slug);

alter table public.products alter column slug set not null;
alter table public.variants alter column slug set not null;
