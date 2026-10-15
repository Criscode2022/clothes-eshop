import { existsSync } from 'node:fs';
import { SEED_PRODUCTS } from './catalog';
import { compositionOf, fitNote, morePieces, portraitOf, relatedPieces } from './cloth';
import { centsUntilFreeShipping } from './money';
import { ordersFromRows, productsFromRows, referenceAfter } from './neon-book';
import type { LineRecord, OrderRecord, ProductRecord, VariantRecord } from './neon-book';

describe('cloth and shipping remainder', () => {
  it('names the cloth and keeps related pieces in the same category', () => {
    const shirt = SEED_PRODUCTS.find((product) => product.id === 'oxford-shirt');
    expect(shirt).toBeTruthy();
    if (!shirt) {
      return;
    }
    expect(compositionOf(shirt)).toContain('Oxford');
    expect(fitNote('shirts').length).toBeGreaterThan(10);
    const related = relatedPieces(SEED_PRODUCTS, shirt);
    expect(related.map((product) => product.id)).toEqual(['silk-tunic']);
    expect(centsUntilFreeShipping(8_900)).toBe(11_100);
    expect(centsUntilFreeShipping(20_000)).toBe(0);
  });

  it('suggests the same category first, then the rest of the floor in order', () => {
    const shirt = SEED_PRODUCTS.find((product) => product.id === 'oxford-shirt');
    expect(shirt).toBeTruthy();
    if (!shirt) {
      return;
    }
    expect(morePieces(SEED_PRODUCTS, shirt).map((product) => product.id)).toEqual([
      'silk-tunic',
      'wool-overcoat',
      'field-jacket',
      'merino-crew',
    ]);
    expect(morePieces(SEED_PRODUCTS, shirt, 2)).toHaveLength(2);
  });
});

describe('photographs by color', () => {
  it('shows a piece in the color asked for, as AVIF with the JPEG it was made from', () => {
    expect(portraitOf('wool-overcoat', 'Charcoal')).toEqual({
      avif: '/garments/wool-overcoat.avif',
      jpeg: '/garments/wool-overcoat.jpg',
    });
    expect(portraitOf('wool-overcoat', 'Camel')).toEqual({
      avif: '/garments/wool-overcoat-camel.avif',
      jpeg: '/garments/wool-overcoat-camel.jpg',
    });
  });

  it('uses the first photograph when no color is asked for', () => {
    expect(portraitOf('wool-overcoat')?.avif).toBe('/garments/wool-overcoat.avif');
    expect(portraitOf('field-jacket', '')?.avif).toBe('/garments/field-jacket.avif');
  });

  it('has no photograph for a color nobody photographed, rather than another color', () => {
    expect(portraitOf('oxford-shirt', 'Navy')).toBeNull();
    expect(portraitOf('owner-added-piece', 'Ink')).toBeNull();
  });

  it('has both encodings on disk for every color on the seeded floor', () => {
    const missing = SEED_PRODUCTS.flatMap((product) =>
      product.variants.flatMap((variant) => {
        const portrait = portraitOf(product.id, variant.color);
        if (!portrait) {
          return [`${product.id} in ${variant.color}: none`];
        }
        return [portrait.avif, portrait.jpeg].filter((src) => !existsSync(`public${src}`));
      }),
    );

    expect(missing).toEqual([]);
  });
});

describe('neon row mapping', () => {
  it('uses slugs as floor ids and keeps the overcoat first', () => {
    const products = productsFromRows(
      [
        product('field-jacket', 'Camel Field Jacket', 'outerwear', 26800),
        product('wool-overcoat', 'Charcoal Wool Overcoat', 'outerwear', 42000),
      ],
      [
        variant('wool-overcoat', 'wool-overcoat-48-charcoal', '48', 'Charcoal', 2),
        variant('wool-overcoat', 'wool-overcoat-46-charcoal', '46', 'Charcoal', 4),
        variant('field-jacket', 'field-jacket-46-camel', '46', 'Camel', 5),
      ],
    );
    expect(products.map((item) => item.id)).toEqual(['wool-overcoat', 'field-jacket']);
    expect(products[0]?.variants.map((item) => item.id)).toEqual([
      'wool-overcoat-46-charcoal',
      'wool-overcoat-48-charcoal',
    ]);
    expect(products[0]?.priceCents).toBe(42000);
  });

  it('attaches order lines to the signed-in client and ignores non-numeric references', () => {
    const products = productsFromRows(
      [product('oxford-shirt', 'Oxford Cloth Shirt', 'shirts', 8900)],
      [variant('oxford-shirt', 'oxford-shirt-s-white', 'S', 'White', 2)],
    );
    const orders = ordersFromRows(
      [order('order-a', 'MR-P-A', '9b58e5af-506a-454c-abd9-d9014416c823')],
      [line('order-a', 'Oxford Cloth Shirt', 'S', 'White', 1, 8900, 8900)],
      products,
    );
    expect(orders[0]?.clientId).toBe('9b58e5af-506a-454c-abd9-d9014416c823');
    expect(orders[0]?.lines[0]?.variantId).toBe('oxford-shirt-s-white');
    expect(referenceAfter(orders)).toBe(1001);
    expect(referenceAfter([{ reference: 'MR-1004' }])).toBe(1005);
  });

  it('reads the state an address names, and none for orders from before states were asked', () => {
    const products = productsFromRows(
      [product('oxford-shirt', 'Oxford Cloth Shirt', 'shirts', 8900)],
      [variant('oxford-shirt', 'oxford-shirt-s-white', 'S', 'White', 2)],
    );
    const rows = [
      { ...order('order-a', 'MR-1001', null), ship_region: 'Rhode Island' },
      order('order-b', 'MR-1002', null),
    ];

    expect(ordersFromRows(rows, [], products).map((item) => item.shipping?.region)).toEqual([
      'Rhode Island',
      '',
    ]);
  });

  it('reads when each order was placed', () => {
    const products = productsFromRows(
      [product('oxford-shirt', 'Oxford Cloth Shirt', 'shirts', 8900)],
      [variant('oxford-shirt', 'oxford-shirt-s-white', 'S', 'White', 2)],
    );
    const rows = [
      { ...order('order-a', 'MR-1001', null), created_at: '2026-10-03 18:03:14+00' },
      { ...order('order-b', 'MR-1002', null), created_at: new Date('2026-10-04T08:00:00Z') },
    ];

    expect(ordersFromRows(rows, [], products).map((item) => item.placedAt)).toEqual([
      '2026-10-03T18:03:14.000Z',
      '2026-10-04T08:00:00.000Z',
    ]);
  });

  it('reads when a bank transfer was paid, as the database returns it, or that it is not yet', () => {
    const products = productsFromRows(
      [product('oxford-shirt', 'Oxford Cloth Shirt', 'shirts', 8900)],
      [variant('oxford-shirt', 'oxford-shirt-s-white', 'S', 'White', 2)],
    );
    const rows = [
      { ...order('order-a', 'MR-1001', null), paid_at: '2026-10-15 14:00:00+00' },
      { ...order('order-b', 'MR-1002', null), paid_at: new Date('2026-10-15T15:30:00Z') },
      order('order-c', 'MR-1003', null),
    ];

    expect(ordersFromRows(rows, [], products).map((item) => item.paidAt)).toEqual([
      '2026-10-15T14:00:00.000Z',
      '2026-10-15T15:30:00.000Z',
      null,
    ]);
  });
});

function product(slug: string, name: string, category: string, price: number): ProductRecord {
  return { slug, name, category, price_cents: price, summary: name, composition: '', care: '' };
}

function variant(
  productSlug: string,
  slug: string,
  size: string,
  color: string,
  stock: number,
): VariantRecord {
  return { product_slug: productSlug, slug, size, color, stock };
}

function order(id: string, reference: string, clientId: string | null): OrderRecord {
  return {
    id,
    reference,
    client_id: clientId,
    contact_name: 'Avery Cole',
    contact_email: 'avery.persona@marlow.shop',
    contact_phone: '5550101',
    delivery: 'ship',
    ship_line1: '1 Loom',
    ship_city: 'Providence',
    ship_region: null,
    ship_postal_code: '02903',
    ship_country: 'United States',
    subtotal_cents: 8900,
    shipping_cents: 800,
    total_cents: 9700,
    payment_method: 'bank-transfer',
    fulfillment: 'placed',
    paid_at: null,
    created_at: '2026-10-15 09:00:00+00',
  };
}

function line(
  orderId: string,
  name: string,
  size: string,
  color: string,
  quantity: number,
  unit: number,
  total: number,
): LineRecord {
  return {
    order_id: orderId,
    product_name: name,
    size,
    color,
    quantity,
    unit_price_cents: unit,
    line_cents: total,
  };
}
