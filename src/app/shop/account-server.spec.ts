import type { Actor } from './access';
import { handleAccountHttp } from './account-server';
import type { AccountDirectory, AccountServerDeps, FreshSignIn } from './account-server';
import { listOrders, placeOrder } from './order-book';
import { accountKindOf } from './session-tokens';
import { FLOOR_PASSWORD_HINT, handleShopHttp, openSession, resetShopServer } from './shop-server';

const ADA: Actor = {
  id: '5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  role: 'client',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

const NOW = Date.parse('2026-10-11T10:00:00Z');

class FakeDirectory implements AccountDirectory {
  readonly renamed: { id: string; name: string }[] = [];
  readonly removed: string[] = [];

  async rename(id: string, name: string): Promise<void> {
    this.renamed.push({ id, name });
  }

  async remove(id: string): Promise<void> {
    this.removed.push(id);
  }
}

function signedInAgain(id: string, issuedAt: number): FreshSignIn {
  return async (token) => (token === 'fresh-jwt' ? { id, issuedAt } : null);
}

function deps(overrides: Partial<AccountServerDeps> = {}): AccountServerDeps {
  return {
    directory: new FakeDirectory(),
    verifyFreshSignIn: signedInAgain(ADA.id, NOW - 30_000),
    now: () => NOW,
    ...overrides,
  };
}

function neonSession(actor: Actor = ADA): string {
  return `Bearer ${openSession(actor).token}`;
}

function floorSession(email = 'avery@marlow.shop'): string {
  const result = handleShopHttp(
    'POST',
    '/api/session',
    { email, password: FLOOR_PASSWORD_HINT },
    null,
  );
  return `Bearer ${(result.body as { token: string }).token}`;
}

describe('shop sessions', () => {
  beforeEach(() => resetShopServer());

  it('hands out tokens nobody can guess, marked with the kind of account', () => {
    const first = openSession(ADA).token;
    const second = openSession(ADA).token;
    const floor = floorSession().slice('Bearer '.length);

    expect(first).not.toBe(second);
    expect(first).toMatch(/^neon_[0-9a-f-]{36}$/);
    expect(accountKindOf(first)).toBe('neon');
    expect(accountKindOf(floor)).toBe('floor');
    expect(accountKindOf('session-1')).toBeNull();
  });
});

describe('account requests', () => {
  beforeEach(() => resetShopServer());

  it('leaves routes it does not own to the shop', async () => {
    expect(await handleAccountHttp('GET', '/api/catalog', null, null, deps())).toBeNull();
  });

  it('renames a Neon account in the directory and in every open session', async () => {
    const directory = new FakeDirectory();
    const authorization = neonSession();

    const result = await handleAccountHttp(
      'PATCH',
      '/api/account',
      { name: '  Ada King  ' },
      authorization,
      deps({ directory }),
    );

    expect(result?.status).toBe(200);
    expect(directory.renamed).toEqual([{ id: ADA.id, name: 'Ada King' }]);
    expect(handleShopHttp('GET', '/api/orders', null, authorization).status).toBe(200);
    expect((result?.body as { actor: Actor }).actor.name).toBe('Ada King');
  });

  it('asks for a real name', async () => {
    const result = await handleAccountHttp(
      'PATCH',
      '/api/account',
      { name: ' A ' },
      neonSession(),
      deps(),
    );

    expect(result).toEqual({
      status: 400,
      body: { message: 'Enter your name, at least 2 letters.' },
    });
  });

  it('keeps the shared floor accounts as they are', async () => {
    const rename = await handleAccountHttp(
      'PATCH',
      '/api/account',
      { name: 'Someone' },
      floorSession(),
      deps(),
    );
    const remove = await handleAccountHttp(
      'DELETE',
      '/api/account',
      { token: 'fresh-jwt' },
      floorSession(),
      deps(),
    );

    expect(rename?.status).toBe(403);
    expect(remove?.status).toBe(403);
  });

  it('says plainly when the shop has no database to change accounts in', async () => {
    const result = await handleAccountHttp(
      'PATCH',
      '/api/account',
      { name: 'Ada King' },
      neonSession(),
      deps({ directory: null }),
    );

    expect(result?.status).toBe(503);
  });

  it('turns away a request with no session', async () => {
    const result = await handleAccountHttp(
      'PATCH',
      '/api/account',
      { name: 'Ada King' },
      null,
      deps(),
    );

    expect(result?.status).toBe(401);
  });

  it('deletes the account after a fresh sign-in and keeps its orders without the link', async () => {
    const directory = new FakeDirectory();
    const authorization = neonSession();
    placeOrder(
      {
        contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
        shipping: {
          line1: '12 Loom Street',
          city: 'Providence',
          postalCode: '02903',
          country: 'US',
        },
        paymentMethod: 'bank-transfer',
        lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 }],
      },
      ADA,
    );

    const result = await handleAccountHttp(
      'DELETE',
      '/api/account',
      { token: 'fresh-jwt' },
      authorization,
      deps({ directory }),
    );

    expect(result).toEqual({ status: 200, body: { deleted: true } });
    expect(directory.removed).toEqual([ADA.id]);
    expect(listOrders(ADA)).toEqual([]);
    expect(listOrders({ ...ADA, role: 'owner' }).map((order) => order.clientId)).toEqual([null]);
    expect(handleShopHttp('GET', '/api/orders', null, authorization).status).toBe(403);
  });

  it('asks for the password again when the sign-in is not fresh or not this account', async () => {
    const stale = await handleAccountHttp(
      'DELETE',
      '/api/account',
      { token: 'fresh-jwt' },
      neonSession(),
      deps({ verifyFreshSignIn: signedInAgain(ADA.id, NOW - 10 * 60_000) }),
    );
    const someoneElse = await handleAccountHttp(
      'DELETE',
      '/api/account',
      { token: 'fresh-jwt' },
      neonSession(),
      deps({ verifyFreshSignIn: signedInAgain('another-person', NOW) }),
    );

    expect(stale?.status).toBe(401);
    expect(someoneElse?.status).toBe(401);
  });

  it('leaves staff accounts to the owner', async () => {
    const worker: Actor = { ...ADA, role: 'worker' };

    const result = await handleAccountHttp(
      'DELETE',
      '/api/account',
      { token: 'fresh-jwt' },
      neonSession(worker),
      deps(),
    );

    expect(result?.status).toBe(403);
  });
});
