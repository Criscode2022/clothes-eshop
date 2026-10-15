import type { ShopOrder } from './checkout';
import { listedOrders, orderListParams, orderListView } from './order-list';

function order(reference: string, totalCents: number, placedAt: string): ShopOrder {
  return {
    reference,
    clientId: null,
    contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
    delivery: 'ship',
    shipping: {
      line1: '12 Loom Street',
      city: 'Providence',
      region: 'Rhode Island',
      postalCode: '02903',
      country: 'United States',
    },
    lines: [],
    subtotalCents: totalCents,
    shippingCents: 0,
    totalCents,
    paymentMethod: 'bank-transfer',
    fulfillment: 'placed',
    paidAt: null,
    placedAt,
  };
}

const BOOK = [
  order('MR-1001', 9_700, '2026-10-01T09:00:00.000Z'),
  order('MR-1002', 42_000, '2026-10-03T09:00:00.000Z'),
  order('MR-1003', 9_700, '2026-10-05T09:00:00.000Z'),
  order('MR-1010', 15_400, '2026-10-07T09:00:00.000Z'),
];
const references = (orders: readonly ShopOrder[]) => orders.map((item) => item.reference);

describe('the order list query', () => {
  it('shows the newest first when the address names nothing', () => {
    const view = orderListView({});

    expect(view).toEqual({ reference: '', sort: 'date', dir: 'desc' });
    expect(references(listedOrders(BOOK, view))).toEqual([
      'MR-1010',
      'MR-1003',
      'MR-1002',
      'MR-1001',
    ]);
  });

  it('turns the date around', () => {
    const view = orderListView({ sort: 'date', dir: 'asc' });

    expect(references(listedOrders(BOOK, view))).toEqual([
      'MR-1001',
      'MR-1002',
      'MR-1003',
      'MR-1010',
    ]);
  });

  it('sorts by price either way, newest first between equal totals', () => {
    expect(references(listedOrders(BOOK, orderListView({ sort: 'price', dir: 'desc' })))).toEqual([
      'MR-1002',
      'MR-1010',
      'MR-1003',
      'MR-1001',
    ]);
    expect(references(listedOrders(BOOK, orderListView({ sort: 'price', dir: 'asc' })))).toEqual([
      'MR-1003',
      'MR-1001',
      'MR-1010',
      'MR-1002',
    ]);
  });

  it('finds a reference by any part of it, in any case, with or without its dash', () => {
    const find = (reference: string) =>
      references(listedOrders(BOOK, orderListView({ reference })));

    expect(find('1003')).toEqual(['MR-1003']);
    expect(find('mr-100')).toEqual(['MR-1003', 'MR-1002', 'MR-1001']);
    expect(find('MR1010')).toEqual(['MR-1010']);
    expect(find('  ')).toEqual(['MR-1010', 'MR-1003', 'MR-1002', 'MR-1001']);
    expect(find('9999')).toEqual([]);
  });

  it('keeps the reference sequence for orders placed in the same instant', () => {
    const sameInstant = BOOK.map((item) => ({ ...item, placedAt: '2026-10-01T09:00:00.000Z' }));

    expect(references(listedOrders(sameInstant, orderListView({})))).toEqual([
      'MR-1010',
      'MR-1003',
      'MR-1002',
      'MR-1001',
    ]);
  });

  it('ignores a sort or direction it does not know', () => {
    expect(orderListView({ sort: 'colour', dir: 'sideways' })).toEqual({
      reference: '',
      sort: 'date',
      dir: 'desc',
    });
  });

  it('writes only what differs from the default into the address', () => {
    expect(orderListParams({ reference: '', sort: 'date', dir: 'desc' })).toEqual({});
    expect(orderListParams({ reference: ' MR-10 ', sort: 'price', dir: 'asc' })).toEqual({
      reference: 'MR-10',
      sort: 'price',
      dir: 'asc',
    });
    expect(orderListParams({ reference: '', sort: 'date', dir: 'asc' })).toEqual({
      sort: 'date',
      dir: 'asc',
    });
  });
});
