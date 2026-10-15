import type { ShopOrder } from './checkout';
import type { Fulfillment } from './fulfillment';
import { QUEUE_VIEWS, ordersInView, queueCounts } from './order-queue';

function order(reference: string, name: string, fulfillment: Fulfillment): ShopOrder {
  return {
    reference,
    clientId: null,
    contact: { name, email: `${name.split(' ')[0]?.toLowerCase()}@example.com`, phone: '5550148' },
    delivery: 'ship',
    shipping: {
      line1: '12 Loom Street',
      city: 'Providence',
      region: 'Rhode Island',
      postalCode: '02903',
      country: 'United States',
    },
    lines: [],
    subtotalCents: 8_900,
    shippingCents: 800,
    totalCents: 9_700,
    paymentMethod: 'bank-transfer',
    fulfillment,
    paidAt: null,
    placedAt: '2026-10-15T09:00:00.000Z',
  };
}

const book = [
  order('MR-1001', 'Ada Lovelace', 'delivered'),
  order('MR-1002', 'Avery Cole', 'placed'),
  order('MR-1003', 'Noah Pell', 'preparing'),
  order('MR-1004', 'Grace Hopper', 'cancelled'),
  order('MR-1005', 'Avery Cole', 'shipped'),
  { ...order('MR-1006', 'Joan Clarke', 'ready'), delivery: 'pickup' as const, shipping: null },
];

describe('desk order queue', () => {
  it('counts the open orders and each state', () => {
    expect(queueCounts(book)).toEqual({
      open: 4,
      placed: 1,
      preparing: 1,
      shipped: 1,
      ready: 1,
      delivered: 1,
      'picked-up': 0,
      cancelled: 1,
    });
  });

  it('names a view for each state, after the open orders', () => {
    expect(QUEUE_VIEWS.map((view) => view.label)).toEqual([
      'Open',
      'Order placed',
      'Being prepared',
      'On its way',
      'Ready to pick up',
      'Delivered',
      'Picked up',
      'Cancelled',
    ]);
  });

  it('shows open orders newest first, a parcel on its way among them', () => {
    expect(ordersInView(book, 'open', '').map((item) => item.reference)).toEqual([
      'MR-1006',
      'MR-1005',
      'MR-1003',
      'MR-1002',
    ]);
  });

  it('narrows a state by reference or client name, ignoring case', () => {
    expect(ordersInView(book, 'cancelled', '').map((item) => item.reference)).toEqual(['MR-1004']);
    expect(ordersInView(book, 'open', 'avery').map((item) => item.reference)).toEqual([
      'MR-1005',
      'MR-1002',
    ]);
    expect(ordersInView(book, 'open', ' mr-1003 ').map((item) => item.reference)).toEqual([
      'MR-1003',
    ]);
    expect(ordersInView(book, 'delivered', 'avery')).toEqual([]);
  });
});
