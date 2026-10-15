import type { Actor } from './access';
import { MARLOW_ACCOUNT, paymentStateOf } from './bank-transfer';
import type { TransferDetails } from './bank-transfer';
import type { ShopOrder } from './checkout';
import { TransferCodes, transferKeyFrom } from './transfer-codes';
import { handleShopHttp, openSession, resetShopServer, transferPathOf } from './shop-server';

const ADA: Actor = {
  id: '5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  role: 'client',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

function placed(paymentMethod = 'bank-transfer', authorization: string | null = null): ShopOrder {
  const result = handleShopHttp(
    'POST',
    '/api/orders',
    {
      contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
      shipping: {
        line1: '12 Loom Street',
        city: 'Providence',
        postalCode: '02903',
        country: 'United States',
      },
      paymentMethod,
      lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 }],
    },
    authorization,
  );
  return result.body as ShopOrder;
}

/** The emailed link's path, as the server writes it for a bank transfer. */
function linkOf(order: ShopOrder): string {
  const path = transferPathOf(order);
  if (!path) {
    throw new Error(`${order.reference} has no transfer link.`);
  }
  return path;
}

/** The bank page asks the shop's API at the same reference and code as its own address. */
function apiPathOf(link: string): string {
  return link.replace(/^\/bank\//, '/api/transfers/');
}

describe('a bank transfer', () => {
  beforeEach(() => resetShopServer());

  it('starts as pending, and only a bank transfer waits for one', () => {
    expect(paymentStateOf(placed())).toBe('pending');
    expect(paymentStateOf(placed('shop-floor'))).toBeNull();
    expect(paymentStateOf(placed('cash-on-delivery'))).toBeNull();
  });

  it('gets a link to the simulated bank in its email; other methods get none', () => {
    expect(linkOf(placed())).toMatch(/^\/bank\/MR-1001\/[\w-]{20,}$/);
    expect(transferPathOf(placed('shop-floor'))).toBeNull();
  });

  it('shows the bank what to pay, to whom, and under which reference', () => {
    const order = placed();

    const result = handleShopHttp('GET', apiPathOf(linkOf(order)), null, null);

    expect(result).toEqual({
      status: 200,
      body: {
        reference: 'MR-1001',
        totalCents: order.totalCents,
        payee: MARLOW_ACCOUNT.name,
        iban: MARLOW_ACCOUNT.iban,
        bic: MARLOW_ACCOUNT.bic,
        state: 'due',
      } satisfies TransferDetails,
    });
  });

  it('marks the order paid once the transfer is sent, and only once', () => {
    const order = placed('bank-transfer', `Bearer ${openSession(ADA).token}`);
    const pay = apiPathOf(linkOf(order));

    const sent = handleShopHttp('POST', pay, {}, null);
    const paid = handleShopHttp(
      'GET',
      `/api/orders/${order.reference}`,
      null,
      `Bearer ${openSession(ADA).token}`,
    ).body as ShopOrder;
    const again = handleShopHttp('POST', pay, {}, null);

    expect((sent.body as TransferDetails).state).toBe('paid');
    expect(paymentStateOf(paid)).toBe('paid');
    expect(paid.paidAt).toEqual(expect.any(String));
    expect((again.body as TransferDetails).state).toBe('paid');
    expect(
      (
        handleShopHttp(
          'GET',
          `/api/orders/${order.reference}`,
          null,
          `Bearer ${openSession(ADA).token}`,
        ).body as ShopOrder
      ).paidAt,
    ).toBe(paid.paidAt);
  });

  it('refuses a link whose code is not the shop own, without saying whether the order exists', () => {
    const order = placed();
    const forged = `/api/transfers/${order.reference}/not-the-code-for-this-order`;
    const elsewhere = apiPathOf(linkOf(order)).replace('MR-1001', 'MR-1002');
    const refusal = { status: 404, body: { message: 'That payment link is not valid.' } };

    expect(handleShopHttp('GET', forged, null, null)).toEqual(refusal);
    expect(handleShopHttp('POST', forged, {}, null)).toEqual(refusal);
    expect(handleShopHttp('GET', elsewhere, null, null)).toEqual(refusal);
    expect(
      paymentStateOf(
        handleShopHttp('GET', `/api/orders/${order.reference}`, null, null).body as ShopOrder,
      ),
    ).toBe('pending');
  });

  it('takes no money for a cancelled order', () => {
    const order = placed('bank-transfer', `Bearer ${openSession(ADA).token}`);
    handleShopHttp(
      'POST',
      `/api/orders/${order.reference}/cancel`,
      {},
      `Bearer ${openSession(ADA).token}`,
    );
    const pay = apiPathOf(linkOf(order));

    expect((handleShopHttp('GET', pay, null, null).body as TransferDetails).state).toBe(
      'cancelled',
    );
    expect(handleShopHttp('POST', pay, {}, null)).toEqual({
      status: 400,
      body: { message: 'Order MR-1001 was cancelled, so there is nothing to pay.' },
    });
  });
});

describe('transfer link codes', () => {
  it('belong to one order and one key', () => {
    const codes = new TransferCodes(transferKeyFrom('postgres://shop-secret'));
    const code = codes.codeFor('MR-1001');

    expect(codes.matches('MR-1001', code)).toBe(true);
    expect(codes.matches('MR-1002', code)).toBe(false);
    expect(codes.matches('MR-1001', `${code}x`)).toBe(false);
    expect(new TransferCodes(transferKeyFrom('postgres://another')).matches('MR-1001', code)).toBe(
      false,
    );
  });
});
