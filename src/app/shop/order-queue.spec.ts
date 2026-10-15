import type { Fulfillment, ShopOrder } from './checkout';
import { fulfillmentName, fulfillmentTrack } from './checkout';
import { newestOrdersFirst, ordersInView, queueCounts } from './order-queue';

function order(reference: string, name: string, fulfillment: Fulfillment): ShopOrder {
  return {
    reference,
    clientId: null,
    contact: { name, email: `${name.split(' ')[0]?.toLowerCase()}@example.com`, phone: '5550148' },
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
  };
}

const book = [
  order('MR-1001', 'Ada Lovelace', 'completed'),
  order('MR-1002', 'Avery Cole', 'placed'),
  order('MR-1003', 'Noah Pell', 'picking'),
  order('MR-1004', 'Grace Hopper', 'cancelled'),
  order('MR-1005', 'Avery Cole', 'ready'),
];

describe('desk order queue', () => {
  it('counts the open orders and each state', () => {
    expect(queueCounts(book)).toEqual({
      open: 3,
      placed: 1,
      picking: 1,
      ready: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  it('shows open orders newest first', () => {
    expect(ordersInView(book, 'open', '').map((item) => item.reference)).toEqual([
      'MR-1005',
      'MR-1003',
      'MR-1002',
    ]);
  });

  it('lists a client’s orders newest first without reordering the book', () => {
    expect(newestOrdersFirst(book).map((item) => item.reference)).toEqual([
      'MR-1005',
      'MR-1004',
      'MR-1003',
      'MR-1002',
      'MR-1001',
    ]);
    expect(book[0]?.reference).toBe('MR-1001');
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
    expect(ordersInView(book, 'completed', 'avery')).toEqual([]);
  });
});

describe('fulfillment track', () => {
  it('marks the steps behind, at, and ahead of an order', () => {
    expect(fulfillmentTrack('picking')).toEqual([
      { state: 'placed', label: 'Placed', status: 'done' },
      { state: 'picking', label: 'Picking', status: 'current' },
      { state: 'ready', label: 'Ready', status: 'upcoming' },
      { state: 'completed', label: 'Completed', status: 'upcoming' },
    ]);
    expect(fulfillmentTrack('completed').every((step) => step.status !== 'upcoming')).toBe(true);
  });

  it('has no track for a cancelled order, only its name', () => {
    expect(fulfillmentTrack('cancelled')).toEqual([]);
    expect(fulfillmentName('cancelled')).toBe('Cancelled');
    expect(fulfillmentName('ready')).toBe('Ready');
  });
});
