import type { ShopOrder } from './checkout';
import {
  canBeCancelled,
  fulfillmentActions,
  fulfillmentName,
  fulfillmentNote,
  fulfillmentTrack,
  transitionFulfillment,
} from './fulfillment';
import type { Fulfillment } from './fulfillment';

const PROVIDENCE = {
  line1: '12 Loom Street',
  city: 'Providence',
  region: 'Rhode Island',
  postalCode: '02903',
  country: 'United States',
};

function shipped(fulfillment: Fulfillment): ShopOrder {
  return {
    reference: 'MR-1001',
    clientId: null,
    contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
    delivery: 'ship',
    shipping: PROVIDENCE,
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

function pickedUp(fulfillment: Fulfillment): ShopOrder {
  return {
    ...shipped(fulfillment),
    delivery: 'pickup',
    shipping: null,
    shippingCents: 0,
    totalCents: 8_900,
    paymentMethod: 'shop-floor',
  };
}

const labels = (order: ShopOrder) => fulfillmentTrack(order).map((step) => step.label);
const statuses = (order: ShopOrder) => fulfillmentTrack(order).map((step) => step.status);

describe('order tracking', () => {
  it('follows a shipped order from the shop to the door', () => {
    expect(labels(shipped('placed'))).toEqual([
      'Order placed',
      'Being prepared',
      'On its way',
      'Delivered',
    ]);
    expect(statuses(shipped('shipped'))).toEqual(['done', 'done', 'current', 'upcoming']);
    expect(statuses(shipped('delivered'))).toEqual(['done', 'done', 'done', 'current']);
  });

  it('follows an order to pick up as far as the counter', () => {
    expect(labels(pickedUp('placed'))).toEqual([
      'Order placed',
      'Being prepared',
      'Ready to pick up',
      'Picked up',
    ]);
    expect(statuses(pickedUp('ready'))).toEqual(['done', 'done', 'current', 'upcoming']);
  });

  it('has no track for a cancelled order, only its name', () => {
    expect(fulfillmentTrack(shipped('cancelled'))).toEqual([]);
    expect(fulfillmentName('cancelled')).toBe('Cancelled');
  });

  it('says in a sentence where the order is', () => {
    expect(fulfillmentNote(shipped('placed'))).toBe(
      'We have your order and will start preparing it soon.',
    );
    expect(fulfillmentNote(shipped('preparing'))).toBe(
      'We are gathering your pieces and packing them in the workroom.',
    );
    expect(fulfillmentNote(shipped('shipped'))).toBe('Your parcel has left the shop for Providence.');
    expect(fulfillmentNote(shipped('delivered'))).toBe(
      'Your parcel was delivered to 12 Loom Street, Providence.',
    );
    expect(fulfillmentNote(pickedUp('preparing'))).toBe(
      'We are gathering your pieces and setting them aside at the counter.',
    );
    expect(fulfillmentNote(pickedUp('ready'))).toBe(
      'Your pieces are waiting at the counter. Give the reference MR-1001 when you come, and pay there.',
    );
    expect(fulfillmentNote({ ...pickedUp('ready'), paymentMethod: 'bank-transfer' })).toBe(
      'Your pieces are waiting at the counter. Give the reference MR-1001 when you come.',
    );
    expect(fulfillmentNote(pickedUp('picked-up'))).toBe('You picked up this order at the shop.');
    expect(fulfillmentNote(pickedUp('cancelled'))).toBe(
      'This order was cancelled, and its pieces went back on the floor.',
    );
  });
});

describe('moving an order', () => {
  it('moves one step at a time along its own track', () => {
    expect(transitionFulfillment(shipped('placed'), 'preparing')).toBe('preparing');
    expect(transitionFulfillment(shipped('preparing'), 'shipped')).toBe('shipped');
    expect(transitionFulfillment(shipped('shipped'), 'delivered')).toBe('delivered');
    expect(transitionFulfillment(pickedUp('preparing'), 'ready')).toBe('ready');
    expect(transitionFulfillment(pickedUp('ready'), 'picked-up')).toBe('picked-up');

    expect(() => transitionFulfillment(shipped('preparing'), 'ready')).toThrow(
      'This order cannot go from “Being prepared” to “Ready to pick up”.',
    );
    expect(() => transitionFulfillment(pickedUp('preparing'), 'shipped')).toThrow(
      'This order cannot go from “Being prepared” to “On its way”.',
    );
    expect(() => transitionFulfillment(shipped('placed'), 'delivered')).toThrow(
      'This order cannot go from “Order placed” to “Delivered”.',
    );
  });

  it('can be cancelled until it leaves the shop, or until it is picked up', () => {
    expect(canBeCancelled(shipped('placed'))).toBe(true);
    expect(canBeCancelled(shipped('preparing'))).toBe(true);
    expect(canBeCancelled(shipped('shipped'))).toBe(false);
    expect(canBeCancelled(shipped('delivered'))).toBe(false);
    expect(canBeCancelled(pickedUp('ready'))).toBe(true);
    expect(canBeCancelled(pickedUp('picked-up'))).toBe(false);
    expect(canBeCancelled(pickedUp('cancelled'))).toBe(false);

    expect(() => transitionFulfillment(shipped('shipped'), 'cancelled')).toThrow(
      'An order that is on its way can no longer be cancelled.',
    );
    expect(() => transitionFulfillment(shipped('cancelled'), 'cancelled')).toThrow(
      'This order is already cancelled.',
    );
  });

  it('offers staff the next step that fits how the order leaves', () => {
    expect(fulfillmentActions(shipped('placed'))).toEqual([
      { target: 'preparing', label: 'Start preparing' },
      { target: 'cancelled', label: 'Cancel' },
    ]);
    expect(fulfillmentActions(shipped('preparing'))[0]).toEqual({
      target: 'shipped',
      label: 'Mark shipped',
    });
    expect(fulfillmentActions(shipped('shipped'))).toEqual([
      { target: 'delivered', label: 'Mark delivered' },
    ]);
    expect(fulfillmentActions(pickedUp('preparing'))[0]).toEqual({
      target: 'ready',
      label: 'Mark ready to pick up',
    });
    expect(fulfillmentActions(pickedUp('ready'))[0]).toEqual({
      target: 'picked-up',
      label: 'Mark picked up',
    });
    expect(fulfillmentActions(pickedUp('picked-up'))).toEqual([]);
  });
});
