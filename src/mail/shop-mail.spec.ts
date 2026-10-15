import type { NeonIdentity } from '../app/shop/neon-adopt';
import type { ShopOrder } from '../app/shop/checkout';
import type { Mailer } from './mailer';
import type { Email } from './shop-emails';
import { ShopMail } from './shop-mail';

const NOW = Date.parse('2026-10-11T10:00:00Z');

class SentMail implements Mailer {
  readonly description = 'test';
  readonly sent: Email[] = [];
  failing = false;

  async send(email: Email): Promise<void> {
    if (this.failing) {
      throw new Error('smtp is down');
    }
    this.sent.push(email);
  }
}

function identity(createdAt: number | null): NeonIdentity {
  return {
    actor: { id: 'ada-id', role: 'client', name: 'Ada', email: 'ada@example.com' },
    issuedAt: NOW,
    createdAt,
  };
}

const ORDER = {
  reference: 'MR-1001',
  clientId: null,
  contact: { name: 'Ada', email: 'ada@example.com', phone: '5550148' },
  shipping: {
    line1: '12 Loom Street',
    city: 'Providence',
    region: 'Rhode Island',
    postalCode: '02903',
    country: 'US',
  },
  lines: [],
  subtotalCents: 0,
  shippingCents: 800,
  totalCents: 800,
  paymentMethod: 'bank-transfer',
  fulfillment: 'placed',
  paidAt: null,
  placedAt: '2026-10-15T09:00:00.000Z',
} satisfies ShopOrder;

describe('shop mail', () => {
  let mailer: SentMail;
  let reported: unknown[];
  let mail: ShopMail;

  beforeEach(() => {
    mailer = new SentMail();
    reported = [];
    mail = new ShopMail(
      mailer,
      'https://marlow.shop',
      (error) => reported.push(error),
      () => NOW,
    );
  });

  it('confirms a placed order to the address typed at checkout', async () => {
    await mail.orderPlaced(ORDER, '/bank/MR-1001/c0de');

    expect(mailer.sent.map((email) => [email.to, email.subject])).toEqual([
      ['ada@example.com', 'Your Marlow order MR-1001'],
    ]);
  });

  it('sends a bank transfer the link to the simulated bank on this shop', async () => {
    await mail.orderPlaced(ORDER, '/bank/MR-1001/c0de');

    expect(mailer.sent[0]?.text).toContain('https://marlow.shop/bank/MR-1001/c0de');
  });

  it('never fails the order when the email cannot go out, and says why in the log', async () => {
    mailer.failing = true;

    await expect(mail.orderPlaced(ORDER, null)).resolves.toBeUndefined();
    expect(reported).toHaveLength(1);
  });

  it('welcomes an account once, right after it was created', async () => {
    await mail.accountCreated(identity(NOW - 60_000), true);
    await mail.accountCreated(identity(NOW - 60_000), true);

    expect(mailer.sent.map((email) => email.subject)).toEqual(['Your Marlow account is open']);
  });

  it('does not welcome an old account or a plain sign-in', async () => {
    await mail.accountCreated(identity(NOW - 2 * 60 * 60_000), true);
    await mail.accountCreated(identity(NOW - 60_000), false);

    expect(mailer.sent).toEqual([]);
  });

  it('lets Neon retry when a reset link could not be delivered', async () => {
    mailer.failing = true;

    await expect(
      mail.authLink({
        kind: 'forget-password',
        to: 'ada@example.com',
        link: 'https://auth.example/reset-password/abc',
        expiresAt: NOW + 15 * 60_000,
      }),
    ).rejects.toThrow('smtp is down');
  });

  it('states how many minutes a reset link lasts', async () => {
    await mail.authLink({
      kind: 'forget-password',
      to: 'ada@example.com',
      link: 'https://auth.example/reset-password/abc',
      expiresAt: NOW + 15 * 60_000,
    });

    expect(mailer.sent[0]?.text).toContain('15 minutes');
  });
});
