import { readFileSync } from 'node:fs';
import { SEED_PRODUCTS } from './catalog';

const sql = readFileSync('db/migrations/001_marlow_shop.sql', 'utf8');

describe('shop row-level security migration', () => {
  it('enables row level security and keeps roles in app_private', () => {
    for (const table of ['public.profiles', 'public.products', 'public.variants', 'public.orders', 'public.order_lines']) {
      expect(sql).toContain(`alter table ${table} enable row level security`);
    }
    expect(sql).toContain('create schema app_private');
    expect(sql).toContain('create function app_private.has_role');
    expect(sql).toContain("app_private.has_role('owner')");
    expect(sql).toContain("app_private.has_role('worker')");
    expect(sql).toContain('security definer');
    expect(sql).toContain('set search_path = \'\'');
    expect(sql).not.toContain('neon_auth.user.role');
  });

  it('gives anonymous no write grant and limits clients to their own orders', () => {
    expect(sql).toMatch(/grant select on public\.products, public\.variants to anonymous, authenticated/);
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)[^;]*\bto\s+anonymous/i);
    expect(sql).toContain('client_id = (select auth.uid())');
    expect(sql).toContain('Only the owner can change a price');
    expect(sql).toContain('Only shop staff can change stock');
    expect(sql).not.toContain('card_number');
    for (const product of SEED_PRODUCTS) {
      expect(sql).toContain(product.name);
      expect(sql).toContain(String(product.priceCents));
    }
  });
});

describe('cloth migration', () => {
  const cloth = readFileSync('db/migrations/002_marlow_cloth.sql', 'utf8');

  it('adds slugs and cloth notes without a write grant for anonymous', () => {
    expect(cloth).toContain('add column if not exists slug');
    expect(cloth).toContain('oxford-shirt-m-white');
    expect(cloth).toContain('ribbed-cardigan-s-oat');
    expect(cloth).toContain('Oxford cotton cloth.');
    expect(cloth.toLowerCase()).not.toContain('to anonymous');
    expect(cloth.toLowerCase()).not.toContain('grant ');
  });
});
