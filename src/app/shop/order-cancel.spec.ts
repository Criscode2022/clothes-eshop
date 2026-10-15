import type { Actor } from './access';
import { canBeCancelled } from './checkout';
import { cancelOrder, listCatalog, moveFulfillment, placeOrder, resetShop } from './order-book';
import { FLOOR_PASSWORD_HINT, handleShopHttp, resetShopServer } from './shop-server';

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

const SHIRT = 'oxford-shirt-s-white';

function shirtOrder(actor: Actor | null, quantity = 2) {
  return placeOrder(
    {
      contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
      shipping: {
        line1: '12 Loom Street',
        city: 'Providence',
        postalCode: '02903',
        country: 'United States',
      },
      paymentMethod: 'bank-transfer',
      lines: [{ productId: 'oxford-shirt', variantId: SHIRT, quantity }],
    },
    actor,
  );
}

function shirtsOnTheFloor(): number {
  const variants = listCatalog().flatMap((product) => product.variants);
  return variants.find((variant) => variant.id === SHIRT)!.stock;
}

describe('cancelling an order', () => {
  beforeEach(() => resetShop());

  it('lets a client cancel their own order and puts its pieces back on the floor', () => {
    const before = shirtsOnTheFloor();
    const order = shirtOrder(avery);
    expect(shirtsOnTheFloor()).toBe(before - 2);

    const cancelled = cancelOrder(avery, order.reference);

    expect(cancelled.fulfillment).toBe('cancelled');
    expect(shirtsOnTheFloor()).toBe(before);
  });

  it('can cancel until the order is completed, and only once', () => {
    expect(['placed', 'picking', 'ready'].every((state) => canBeCancelled(state as never))).toBe(
      true,
    );
    expect(canBeCancelled('completed')).toBe(false);
    expect(canBeCancelled('cancelled')).toBe(false);

    const order = shirtOrder(avery);
    moveFulfillment(jordan, order.reference, 'picking');
    moveFulfillment(jordan, order.reference, 'ready');
    const before = shirtsOnTheFloor();
    cancelOrder(avery, order.reference);

    expect(() => cancelOrder(avery, order.reference)).toThrow(/cancelled cannot move/);
    expect(shirtsOnTheFloor()).toBe(before + 2);

    const completed = shirtOrder(avery, 1);
    moveFulfillment(jordan, completed.reference, 'picking');
    moveFulfillment(jordan, completed.reference, 'ready');
    moveFulfillment(jordan, completed.reference, 'completed');
    expect(() => cancelOrder(avery, completed.reference)).toThrow(/completed cannot move/);
  });

  it("refuses another client's order, a guest's order, and a visitor with no session", () => {
    const averys = shirtOrder(avery, 1);
    const guests = shirtOrder(null, 1);

    expect(() => cancelOrder(noah, averys.reference)).toThrow('That order is not available.');
    expect(() => cancelOrder(avery, guests.reference)).toThrow('That order is not available.');
    expect(() => cancelOrder(null, guests.reference)).toThrow('Sign in to cancel an order.');
  });

  it('puts the pieces back when staff cancel from the desk too', () => {
    const before = shirtsOnTheFloor();
    const order = shirtOrder(null);

    moveFulfillment(jordan, order.reference, 'cancelled');

    expect(shirtsOnTheFloor()).toBe(before);
    expect(cancelOrder(jordan, shirtOrder(null, 1).reference).fulfillment).toBe('cancelled');
  });
});

describe('POST /api/orders/:reference/cancel', () => {
  beforeEach(() => resetShopServer());

  function tokenFor(email: string): string {
    const result = handleShopHttp(
      'POST',
      '/api/session',
      { email, password: FLOOR_PASSWORD_HINT },
      null,
    );
    return `Bearer ${(result.body as { token: string }).token}`;
  }

  it('cancels the signed-in client’s order, and answers 403 without a session', () => {
    const order = shirtOrder(avery, 1);
    const path = `/api/orders/${order.reference}/cancel`;

    expect(handleShopHttp('POST', path, {}, null)).toEqual({
      status: 403,
      body: { message: 'Sign in to cancel an order.' },
    });
    expect(handleShopHttp('POST', path, {}, tokenFor('noah@marlow.shop')).status).toBe(400);

    const cancelled = handleShopHttp('POST', path, {}, tokenFor('avery@marlow.shop'));

    expect(cancelled.status).toBe(200);
    expect((cancelled.body as { fulfillment: string }).fulfillment).toBe('cancelled');
  });
});
