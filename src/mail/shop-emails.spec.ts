import { MARLOW_ACCOUNT } from '../app/shop/bank-transfer';
import type { ShopOrder } from '../app/shop/checkout';
import { accountCreatedEmail, authCodeEmail, authLinkEmail, orderPlacedEmail } from './shop-emails';

const SHOP = 'https://marlow.shop';

const ORDER: ShopOrder = {
  reference: 'MR-1001',
  clientId: null,
  contact: { name: 'Ada <Lovelace>', email: 'ada@example.com', phone: '5550148' },
  shipping: {
    line1: '12 Loom Street',
    city: 'Providence',
    postalCode: '02903',
    country: 'United States',
  },
  lines: [
    {
      productId: 'oxford-shirt',
      variantId: 'oxford-shirt-m-white',
      name: 'Oxford Cloth Shirt',
      size: 'M',
      color: 'White',
      quantity: 2,
      unitPriceCents: 8_900,
      lineCents: 17_800,
    },
  ],
  subtotalCents: 17_800,
  shippingCents: 800,
  totalCents: 18_600,
  paymentMethod: 'bank-transfer',
  fulfillment: 'placed',
  paidAt: null,
};

const BANK_LINK = '/bank/MR-1001/c0de-for-mr-1001';

describe('order confirmation email', () => {
  const email = orderPlacedEmail(ORDER, SHOP, BANK_LINK);

  it('goes to the contact address with the reference in the subject', () => {
    expect(email.to).toBe('ada@example.com');
    expect(email.subject).toBe('Your Marlow order MR-1001');
  });

  it('states every line, the costs, the payment method, and where it ships', () => {
    for (const body of [email.text, email.html]) {
      expect(body).toContain('Oxford Cloth Shirt');
      expect(body).toContain('White, size M');
      expect(body).toContain('$178.00');
      expect(body).toContain('$8.00');
      expect(body).toContain('$186.00');
      expect(body).toContain(
        'Bank transfer, pending until the transfer arrives. No card was taken.',
      );
      expect(body).toContain('12 Loom Street');
    }
    expect(email.text).toContain('https://marlow.shop/order/MR-1001');
    expect(email.html).toContain('href="https://marlow.shop/order/MR-1001"');
  });

  it('never lets typed text become markup', () => {
    expect(email.html).toContain('Ada &lt;Lovelace&gt;');
    expect(email.html).not.toContain('<Lovelace>');
  });

  it('says shipping is free when it is', () => {
    const free = orderPlacedEmail(
      { ...ORDER, shippingCents: 0, totalCents: 17_800 },
      SHOP,
      BANK_LINK,
    );

    expect(free.text).toContain('Shipping: Free');
  });
});

describe('bank transfer in the order email', () => {
  const email = orderPlacedEmail(ORDER, SHOP, BANK_LINK);

  it('gives the account to pay into, the amount, and the reference to quote', () => {
    for (const body of [email.text, email.html]) {
      expect(body).toContain(MARLOW_ACCOUNT.name);
      expect(body).toContain(MARLOW_ACCOUNT.iban);
      expect(body).toContain(MARLOW_ACCOUNT.bic);
      expect(body).toContain('$186.00');
      expect(body).toContain('Reference to quote');
      expect(body).toContain('fictional');
    }
  });

  it('links to the simulated bank, and still to the order', () => {
    expect(email.text).toContain('https://marlow.shop/bank/MR-1001/c0de-for-mr-1001');
    expect(email.html).toContain('href="https://marlow.shop/bank/MR-1001/c0de-for-mr-1001"');
    expect(email.html).toContain('Pay with Sandbox Bank');
    expect(email.html).toContain('href="https://marlow.shop/order/MR-1001"');
  });

  it('leaves bank details out of the methods paid in person', () => {
    const atShop = orderPlacedEmail({ ...ORDER, paymentMethod: 'shop-floor' }, SHOP, null);

    expect(atShop.text).toContain('Pay at the shop. No card was taken.');
    expect(atShop.text).not.toContain(MARLOW_ACCOUNT.iban);
    expect(atShop.html).not.toContain('Sandbox Bank');
  });
});

describe('account created email', () => {
  it('tells the person their account is open, without asking them to confirm anything', () => {
    const email = accountCreatedEmail({ name: 'Ada', email: 'ada@example.com' }, SHOP);

    expect(email.to).toBe('ada@example.com');
    expect(email.subject).toBe('Your Marlow account is open');
    expect(email.text).toContain('Your Marlow account for ada@example.com is open.');
    expect(email.text).toContain('https://marlow.shop/account');
    expect(email.text.toLowerCase()).not.toContain('confirm');
  });
});

describe('sign-in emails from Neon Auth', () => {
  it('sends the password reset link with how long it lasts', () => {
    const email = authLinkEmail({
      kind: 'forget-password',
      to: 'ada@example.com',
      link: 'https://auth.example/reset-password/abc?callbackURL=x',
      minutes: 15,
    });

    expect(email.subject).toBe('Choose a new Marlow password');
    expect(email.text).toContain('https://auth.example/reset-password/abc?callbackURL=x');
    expect(email.text).toContain('15 minutes');
    expect(email.html).toContain('href="https://auth.example/reset-password/abc?callbackURL=x"');
    expect(email.text).toContain('your password stays as it is');
  });

  it('refuses a link that is not a web address', () => {
    expect(() =>
      authLinkEmail({
        kind: 'sign-in',
        to: 'ada@example.com',
        link: 'javascript:alert(1)',
        minutes: 15,
      }),
    ).toThrow();
  });

  it('sends a code in words and digits', () => {
    const email = authCodeEmail({
      kind: 'forget-password',
      to: 'ada@example.com',
      code: '482913',
      minutes: 10,
    });

    expect(email.subject).toBe('Your Marlow code: 482913');
    expect(email.text).toContain('482913');
    expect(email.text).toContain('10 minutes');
  });
});
