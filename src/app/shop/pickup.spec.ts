import { SEED_PRODUCTS } from './catalog';
import { paymentMethodsFor, quoteOrder } from './checkout';
import type { ShopOrder } from './checkout';
import { ordersFromRows, productsFromRows } from './neon-book';
import type { OrderRecord } from './neon-book';
import { handleShopHttp, resetShopServer } from './shop-server';

const ADA = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+1 401 555 0148' };
const PROVIDENCE = {
  line1: '12 Loom Street',
  city: 'Providence',
  region: 'Rhode Island',
  postalCode: '02903',
  country: 'United States',
};
const SHIRT = [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 }];

function place(body: Record<string, unknown>): { status: number; body: unknown } {
  return handleShopHttp('POST', '/api/orders', { contact: ADA, lines: SHIRT, ...body }, null);
}

describe('picking an order up at the shop', () => {
  beforeEach(() => resetShopServer());

  it('stores an order to pick up with no address and nothing to pay for shipping', () => {
    const placed = place({ delivery: 'pickup', shipping: null, paymentMethod: 'shop-floor' });

    expect(placed.status).toBe(201);
    const order = placed.body as ShopOrder;
    expect(order.delivery).toBe('pickup');
    expect(order.shipping).toBeNull();
    expect(order.shippingCents).toBe(0);
    expect(order.totalCents).toBe(order.subtotalCents);
    expect(order.fulfillment).toBe('placed');
  });

  it('keeps no address sent along with an order to pick up', () => {
    const placed = place({ delivery: 'pickup', shipping: PROVIDENCE, paymentMethod: 'shop-floor' });

    expect((placed.body as ShopOrder).shipping).toBeNull();
  });

  it('lets only an order picked up at the shop be paid there', () => {
    expect(place({ delivery: 'ship', shipping: PROVIDENCE, paymentMethod: 'shop-floor' })).toEqual({
      status: 400,
      body: { message: 'Pay at the shop is only for orders picked up at the shop.' },
    });
    expect(place({ delivery: 'pickup', paymentMethod: 'cash-on-delivery' })).toEqual({
      status: 400,
      body: { message: 'Cash when it arrives is only for orders shipped to an address.' },
    });
    expect(place({ delivery: 'pickup', paymentMethod: 'bank-transfer' }).status).toBe(201);
  });

  it('still asks an order shipped to an address for the address', () => {
    expect(place({ delivery: 'ship', paymentMethod: 'bank-transfer' }).body).toEqual({
      message: 'Enter the address to ship to.',
    });
    const shipped = place({ delivery: 'ship', shipping: PROVIDENCE, paymentMethod: 'bank-transfer' });
    expect((shipped.body as ShopOrder).shipping).toEqual(PROVIDENCE);
    expect((shipped.body as ShopOrder).shippingCents).toBe(800);
  });

  it('ships an order from a checkout page that did not ask, and refuses a way it does not know', () => {
    const fromAnOldPage = place({ shipping: PROVIDENCE, paymentMethod: 'bank-transfer' });
    expect((fromAnOldPage.body as ShopOrder).delivery).toBe('ship');

    expect(place({ delivery: 'drone', paymentMethod: 'bank-transfer' }).body).toEqual({
      message: 'Choose how the order reaches you.',
    });
  });

  it('offers the ways to pay that fit each way to receive the order', () => {
    const ids = (delivery: 'ship' | 'pickup') =>
      paymentMethodsFor(delivery).map((method) => method.id);

    expect(ids('pickup')).toEqual(['shop-floor', 'bank-transfer']);
    expect(ids('ship')).toEqual(['bank-transfer', 'cash-on-delivery']);
  });

  it('charges shipping only on an order that ships', () => {
    expect(quoteOrder(SHIRT, SEED_PRODUCTS, 'ship').shippingCents).toBe(800);
    expect(quoteOrder(SHIRT, SEED_PRODUCTS, 'pickup').shippingCents).toBe(0);
  });

  it('reads an order to pick up from its row, without an address', () => {
    const products = productsFromRows([], []);
    const row: OrderRecord = {
      id: 'order-a',
      reference: 'MR-1001',
      client_id: null,
      contact_name: 'Ada Lovelace',
      contact_email: 'ada@example.com',
      contact_phone: '5550148',
      delivery: 'pickup',
      ship_line1: null,
      ship_city: null,
      ship_region: null,
      ship_postal_code: null,
      ship_country: null,
      subtotal_cents: 8900,
      shipping_cents: 0,
      total_cents: 8900,
      payment_method: 'shop-floor',
      fulfillment: 'ready',
      paid_at: null,
      created_at: '2026-10-15 09:00:00+00',
    };

    const [order] = ordersFromRows([row], [], products);

    expect(order?.delivery).toBe('pickup');
    expect(order?.shipping).toBeNull();
    expect(order?.fulfillment).toBe('ready');
  });
});
