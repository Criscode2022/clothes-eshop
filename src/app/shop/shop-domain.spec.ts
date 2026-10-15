import { SEED_PRODUCTS, productsIn } from './catalog';
import { StockLimitError, addLine, changeQuantity } from './cart';
import { paymentLabel, quoteOrder } from './checkout';
import { transitionFulfillment } from './fulfillment';
import { canChangePrice, canOpenArea, ordersVisibleTo } from './access';
import type { Actor } from './access';
import { formatMoney, shippingFor } from './money';
import { listCatalog, listOrders, placeOrder, resetShop, setProductPrice, setVariantStock } from './order-book';
import { handleShopHttp, openSession, resetShopServer } from './shop-server';

const avery: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000001',
  role: 'client',
  name: 'Avery Cole',
  email: 'avery@marlow.shop',
};
const noah: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000002',
  role: 'client',
  name: 'Noah Pell',
  email: 'noah@marlow.shop',
};
const jordan: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000003',
  role: 'worker',
  name: 'Jordan Hale',
  email: 'jordan@marlow.shop',
};
const sloan: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000004',
  role: 'owner',
  name: 'Sloan Marlow',
  email: 'sloan@marlow.shop',
};

const contact = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' };
const shipping = { line1: '12 Loom Street', city: 'Providence', region: 'Rhode Island', postalCode: '02903', country: 'United States' };

function shirtDraft(quantity = 1) {
  return {
    contact,
    delivery: 'ship',
    shipping,
    paymentMethod: 'bank-transfer',
    lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity }],
  };
}

describe('clothing catalog', () => {
  it('seeds more than one category and pieces with a price, stock, and a size or color', () => {
    const categories = new Set(SEED_PRODUCTS.map((product) => product.category));

    expect(categories.size).toBeGreaterThan(1);
    expect(productsIn(SEED_PRODUCTS, 'shirts').length).toBeGreaterThan(0);
    expect(productsIn(SEED_PRODUCTS, 'outerwear').length).toBeGreaterThan(0);
    for (const product of SEED_PRODUCTS) {
      expect(product.priceCents).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.variants.some((variant) => variant.size.length > 0 || variant.color.length > 0)).toBe(true);
      expect(product.variants.every((variant) => variant.stock >= 0)).toBe(true);
    }
    expect(formatMoney(42_000)).toBe('$420.00');
  });
});

describe('bag and checkout', () => {
  beforeEach(() => resetShop());

  it('refuses a quantity above stock and keeps the previous quantity', () => {
    const stock = 2;
    const once = addLine([], 'oxford-shirt', 'oxford-shirt-s-white', 1, stock);
    const twice = addLine(once, 'oxford-shirt', 'oxford-shirt-s-white', 1, stock);

    expect(twice[0]?.quantity).toBe(2);
    expect(() => addLine(twice, 'oxford-shirt', 'oxford-shirt-s-white', 1, stock)).toThrow(StockLimitError);
    expect(() => changeQuantity(twice, 'oxford-shirt-s-white', 3, stock)).toThrow(StockLimitError);
    expect(twice[0]?.quantity).toBe(2);
  });

  it('stores a guest order whose total is the lines plus shipping and records the method, not a card', () => {
    const quote = quoteOrder(shirtDraft().lines, SEED_PRODUCTS, 'ship');
    const order = placeOrder(shirtDraft(), null);

    expect(quote.shippingCents).toBe(shippingFor(quote.subtotalCents));
    expect(quote.totalCents).toBe(quote.subtotalCents + quote.shippingCents);
    expect(order.clientId).toBeNull();
    expect(order.lines).toEqual(quote.lines);
    expect(order.totalCents).toBe(quote.totalCents);
    expect(order.paymentMethod).toBe('bank-transfer');
    expect(paymentLabel(order.paymentMethod)).toBe('Bank transfer');
    expect(order.reference).toBe('MR-1001');
    expect(listCatalog().find((product) => product.id === 'oxford-shirt')?.variants[0]?.stock).toBe(1);

    expect(() => placeOrder(shirtDraft(), null, { ...shirtDraft(), cardNumber: '4242424242424242' })).toThrow(/card/i);
    expect(listOrders(sloan)).toHaveLength(1);
  });

  it('shows a client only the orders stored with that client id', () => {
    placeOrder(shirtDraft(), avery);
    placeOrder(
      {
        ...shirtDraft(),
        lines: [{ productId: 'silk-tunic', variantId: 'silk-tunic-s-ivory', quantity: 1 }],
      },
      noah,
    );
    placeOrder(
      {
        ...shirtDraft(),
        lines: [{ productId: 'merino-crew', variantId: 'merino-crew-s-ink', quantity: 1 }],
      },
      null,
    );

    expect(ordersVisibleTo(avery, listOrders(sloan)).map((order) => order.clientId)).toEqual([avery.id]);
    expect(listOrders(avery).map((order) => order.reference)).toEqual(['MR-1001']);
    expect(listOrders(noah).map((order) => order.reference)).toEqual(['MR-1002']);
    expect(listOrders(null)).toEqual([]);
    expect(listOrders(sloan)).toHaveLength(3);
    expect(listOrders(jordan)).toHaveLength(3);
  });
});

describe('staff powers', () => {
  beforeEach(() => resetShop());

  it('lets a worker move fulfillment and stock, and only the owner change a price', () => {
    const order = placeOrder(shirtDraft(), null);

    expect(canOpenArea('desk', null)).toBe(false);
    expect(canOpenArea('owner', avery)).toBe(false);
    expect(canOpenArea('desk', avery)).toBe(false);
    expect(canOpenArea('owner', jordan)).toBe(false);
    expect(canOpenArea('desk', jordan)).toBe(true);
    expect(canOpenArea('owner', sloan)).toBe(true);
    expect(canChangePrice(jordan)).toBe(false);

    expect(transitionFulfillment(order, 'preparing')).toBe('preparing');
    expect(transitionFulfillment(order, 'cancelled')).toBe('cancelled');
    expect(() => setProductPrice(jordan, 'oxford-shirt', 1000)).toThrow(/price/i);
    expect(setProductPrice(sloan, 'oxford-shirt', 9100).priceCents).toBe(9100);
    expect(setVariantStock(jordan, 'oxford-shirt-m-white', 3).variants.find((variant) => variant.id === 'oxford-shirt-m-white')?.stock).toBe(3);
    expect(() => setVariantStock(avery, 'oxford-shirt-m-white', 1)).toThrow(/stock/i);

    const moved = handleShopHttp(
      'POST',
      `/api/orders/${order.reference}/fulfillment`,
      { fulfillment: 'cancelled' },
      signedInAs(jordan),
    );
    expect(moved.status).toBe(200);
    expect((moved.body as { fulfillment: string }).fulfillment).toBe('cancelled');
  });

  it('publishes a price and a sale on the process store the server render reads', () => {
    expect(setProductPrice(sloan, 'oxford-shirt', 9100).priceCents).toBe(9100);
    const order = placeOrder(
      {
        ...shirtDraft(),
        lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 2 }],
      },
      null,
    );
    expect(order.lines[0]?.unitPriceCents).toBe(9100);
    expect(order.totalCents).toBe(9100 * 2 + shippingFor(18_200));

    const shared = (
      globalThis as typeof globalThis & {
        [key: symbol]: {
          products: { id: string; priceCents: number; variants: { id: string; stock: number }[] }[];
        };
      }
    )[Symbol.for('marlow.shop.state')];
    const shirt = shared.products.find((product) => product.id === 'oxford-shirt');
    expect(shirt?.priceCents).toBe(9100);
    expect(shirt?.variants.find((variant) => variant.id === 'oxford-shirt-s-white')?.stock).toBe(0);
    expect(listCatalog().find((product) => product.id === 'oxford-shirt')?.variants.find((variant) => variant.id === 'oxford-shirt-s-white')?.stock).toBe(0);
  });
});

describe('shop server', () => {
  beforeEach(() => resetShopServer());

  it('stores a guest order through the same server entry the Node process calls', () => {
    const created = handleShopHttp('POST', '/api/orders', shirtDraft(), null);
    const body = created.body as { reference: string; totalCents: number; paymentMethod: string };

    expect(created.status).toBe(201);
    expect(body.reference).toBe('MR-1001');
    expect(body.paymentMethod).toBe('bank-transfer');

    const read = handleShopHttp('GET', `/api/orders/${body.reference}`, null, null);
    expect(read.status).toBe(200);
    expect((read.body as { totalCents: number }).totalCents).toBe(body.totalCents);

    const refused = handleShopHttp('POST', '/api/products/oxford-shirt/price', { priceCents: 100 }, signedInAs(jordan));
    expect(refused.status).toBe(403);

    const priced = handleShopHttp('POST', '/api/products/oxford-shirt/price', { priceCents: 9000 }, signedInAs(sloan));
    expect(priced.status).toBe(200);
    expect((priced.body as { priceCents: number }).priceCents).toBe(9000);
  });
});

function signedInAs(actor: Actor): string {
  return `Bearer ${openSession(actor).token}`;
}
