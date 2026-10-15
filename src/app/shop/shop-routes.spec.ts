import { Location } from '@angular/common';
import {
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { of, throwError } from 'rxjs';
import { App } from '../app';
import { routes } from '../app.routes';
import { Bag } from './bag';
import { formatMoney } from './money';
import { quoteOrder } from './checkout';
import { SEED_PRODUCTS } from './catalog';
import type { Product } from './catalog';
import { NeonAuth } from './neon-auth';
import { handleShopHttp, openSession, resetShopServer, transferPathOf } from './shop-server';
import type { ShopOrder } from './checkout';
import { ShopSession } from './shop-session';
import type { Actor } from './access';

const AVERY: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000001',
  role: 'client',
  name: 'Avery Cole',
  email: 'avery@example.com',
};
const JORDAN: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000003',
  role: 'worker',
  name: 'Jordan Hale',
  email: 'jordan@example.com',
};
const SLOAN: Actor = {
  id: '8a1c1a10-0000-4000-8000-000000000004',
  role: 'owner',
  name: 'Sloan Marlow',
  email: 'sloan@example.com',
};

const shopApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, 'http://marlow.test');
  if (!url.pathname.startsWith('/api/')) {
    return next(req);
  }
  const result = handleShopHttp(
    req.method,
    url.pathname,
    req.body,
    req.headers.get('Authorization'),
  );
  if (result.status >= 400) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: result.status,
          error: result.body,
          url: req.url,
        }),
    );
  }
  return of(new HttpResponse({ status: result.status, body: result.body }));
};

describe('shop routes', () => {
  // jsdom lays nothing out; the country list measures itself and scrolls its highlighted option.
  beforeAll(() => {
    Element.prototype.scrollIntoView ??= () => undefined;
    globalThis.ResizeObserver ??= class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  });

  beforeEach(() => {
    resetShopServer();
    localStorage.clear();
  });

  it('lets a guest reach confirmation without signing in', async () => {
    const { fixture } = await render('/product/oxford-shirt');
    await choose(fixture, 'input[name="size"][value="S"]');
    await clickButton(fixture, 'Add to bag');
    expect(document.body.textContent).toContain('Added Oxford Cloth Shirt, White S.');

    await go(fixture, '/checkout');
    expect(document.body.textContent).toContain('An account is optional');

    await typeInto(fixture, 'contact-name', 'Ada Lovelace');
    await typeInto(fixture, 'contact-email', 'ada@example.com');
    await typeInto(fixture, 'contact-phone', '5550148');
    await typeInto(fixture, 'ship-line1', '12 Loom Street');
    await typeInto(fixture, 'ship-city', 'Providence');
    await pick(fixture, 'ship-region', 'Rhode Island');
    await typeInto(fixture, 'ship-postal', '02903');
    await choose(fixture, 'input[value="bank-transfer"]');
    await clickButton(fixture, 'Place order');

    const quote = quoteOrder(
      [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 1 }],
      SEED_PRODUCTS,
    );
    expect(quote.totalCents).toBe(quote.subtotalCents + quote.shippingCents);
    expect(TestBed.inject(Router).url).toBe('/order/MR-1001');
    expect(document.body.textContent).toContain('Your order is placed.');
    expect(document.body.textContent).toContain('MR-1001');
    expect(document.body.textContent).toContain('Oxford Cloth Shirt');
    expect(document.body.textContent).toContain('Bank transfer');
    expect(document.body.textContent).toContain(formatMoney(quote.totalCents));
    expect(document.body.textContent).toContain('Providence, Rhode Island 02903');
  });

  it('shows what to fix as soon as a field is left, before the order is sent', async () => {
    const { fixture } = await checkoutWithAShirt();

    await typeInto(fixture, 'contact-email', 'ada@example');
    await typeInto(fixture, 'contact-phone', '555 014');
    await typeInto(fixture, 'ship-postal', '2903');

    expect(document.getElementById('contact-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(fieldError('contact-email')).toBe('Enter an email address, like name@example.com.');
    expect(fieldError('contact-phone')).toBe('Enter a phone number with 7 to 15 digits.');
    expect(fieldError('ship-postal')).toBe('Enter a ZIP code like 02903: 5 digits, or ZIP+4.');
    expect(fieldError('ship-line1')).toBeUndefined();

    await typeInto(fixture, 'contact-email', 'ada@example.com');
    expect(fieldError('contact-email')).toBeUndefined();
  });

  it('adapts the address to the country: a state in the United States, the Spanish format in Spain', async () => {
    const { fixture } = await checkoutWithAShirt();
    expect(labelOf('ship-region')).toBe('State');
    expect(labelOf('ship-postal')).toBe('ZIP code');
    expect(document.getElementById('contact-phone-hint')?.textContent).toContain('+1');

    await chooseCountry(fixture, 'españa', 'Spain');
    expect(document.getElementById('ship-region')).toBeNull();
    expect(labelOf('ship-postal')).toBe('Postal code');
    expect(document.getElementById('ship-postal-hint')?.textContent).toBe('Like 28013');
    expect(document.getElementById('contact-phone-hint')?.textContent).toContain('+34');
    await typeInto(fixture, 'ship-postal', '53001');
    expect(fieldError('ship-postal')).toBe(
      'Enter a postal code like 28013: 5 digits, starting 01 to 52.',
    );
    await typeInto(fixture, 'ship-postal', '28013');
    expect(fieldError('ship-postal')).toBeUndefined();

    await chooseCountry(fixture, 'canada', 'Canada');
    expect(labelOf('ship-region')).toBe('Province or territory');
    await typeInto(fixture, 'ship-postal', 'k1a0b1');
    document
      .getElementById('ship-postal')
      ?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle(fixture);
    expect((document.getElementById('ship-postal') as HTMLInputElement).value).toBe('K1A 0B1');
    expect(fieldError('ship-postal')).toBeUndefined();
  });

  it('keeps everything typed and points at what is missing when checkout is incomplete', async () => {
    const { fixture } = await render('/product/oxford-shirt');
    await choose(fixture, 'input[name="size"][value="M"]');
    await clickButton(fixture, 'Add to bag');
    await go(fixture, '/checkout');

    await typeInto(fixture, 'contact-name', 'Ada Lovelace');
    await clickButton(fixture, 'Place order');

    expect(TestBed.inject(Router).url).toBe('/checkout');
    expect(document.getElementById('contact-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.body.textContent).toContain('Enter an email for the receipt.');
    expect(document.body.textContent).toContain('Choose how you will pay.');
    expect((document.getElementById('contact-name') as HTMLInputElement).value).toBe(
      'Ada Lovelace',
    );
  });

  it('adds a size from the floor without leaving it', async () => {
    const { fixture } = await render('/');
    await clickButton(fixture, 'Quick add Oxford Cloth Shirt');
    await clickLabelled(fixture, '#sizes-oxford-shirt', 'Add M to bag');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(TestBed.inject(Bag).items()).toEqual([
      { productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 },
    ]);
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      'Added Oxford Cloth Shirt, White M.',
    );
  });

  it('keeps the bag in its drawer, with no page of its own', async () => {
    const { fixture } = await render('/bag');
    expect(TestBed.inject(Router).url).toBe('/');

    await go(fixture, '/product/oxford-shirt');
    await choose(fixture, 'input[name="size"][value="M"]');
    await clickButton(fixture, 'Add to bag');
    await go(fixture, '/checkout');
    await clickButton(fixture, 'Change the bag');

    expect(TestBed.inject(Router).url).toBe('/checkout');
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Keep shopping');
  });

  it('shows a signed-in client their name, their orders, and a way to sign out', async () => {
    const { fixture } = await render('/');
    adopt(fixture, AVERY);
    await settle(fixture);
    const header = (): HTMLElement => document.querySelector('header')!;

    expect(header().querySelector('a[href="/account"]')?.textContent).toContain('Avery Cole');
    expect(header().querySelector('a[href="/account/orders"]')?.textContent?.trim()).toBe('Orders');
    expect(header().querySelector('a[href="/sign-in"]')).toBeNull();

    await clickLabelled(fixture, 'header', 'Sign out');

    expect(TestBed.inject(ShopSession).current()).toBeNull();
    expect(header().textContent).not.toContain('Avery Cole');
    expect(header().querySelector('a[href="/sign-in"]')).not.toBeNull();
    expect(document.activeElement).toBe(header().querySelector('a[href="/sign-in"]'));
  });

  it('gives staff their desk in the header instead of client orders', async () => {
    const { fixture } = await render('/');
    adopt(fixture, JORDAN);
    await settle(fixture);
    const header = document.querySelector('header')!;

    expect(header.querySelector('a[href="/account"]')?.textContent).toContain('Jordan Hale');
    expect(header.querySelector('a[href="/desk"]')).not.toBeNull();
    expect(header.querySelector('a[href="/account/orders"]')).toBeNull();
    expect(header.querySelector('button[aria-label="Sign out"]')).not.toBeNull();
  });

  it('keeps the bag before sign out, which stands last in the header', async () => {
    const { fixture } = await render('/');
    adopt(fixture, AVERY);
    await settle(fixture);

    const tools = [...document.querySelectorAll('header .bar__tools > *')];

    expect(tools.at(-2)?.classList).toContain('bag-button');
    expect(tools.at(-1)?.getAttribute('aria-label')).toBe('Sign out');
  });

  it('shows the piece in the color the shopper picks', async () => {
    const { fixture } = await render('/product/wool-overcoat');
    const photo = (): HTMLImageElement | null => document.querySelector('.pdp__media img');
    const sources = (): string[] =>
      [...document.querySelectorAll('.pdp__media source')].map(
        (source) => `${source.getAttribute('type')} ${source.getAttribute('srcset')}`,
      );

    expect(photo()?.getAttribute('src')).toBe('/garments/wool-overcoat.avif');
    expect(sources()).toEqual([
      'image/avif /garments/wool-overcoat.avif',
      'image/jpeg /garments/wool-overcoat.jpg',
    ]);
    expect(photo()?.alt).toBe('Charcoal Wool Overcoat in Charcoal');

    await choose(fixture, 'input[name="color"][value="Camel"]');

    expect(photo()?.getAttribute('src')).toBe('/garments/wool-overcoat-camel.avif');
    expect(sources()).toEqual([
      'image/avif /garments/wool-overcoat-camel.avif',
      'image/jpeg /garments/wool-overcoat-camel.jpg',
    ]);
    expect(photo()?.alt).toBe('Charcoal Wool Overcoat in Camel');
  });

  it('asks for a size instead of guessing one', async () => {
    const { fixture } = await render('/product/oxford-shirt');

    await clickButton(fixture, 'Add to bag');

    expect(document.body.textContent).toContain('Choose a size to add it to your bag.');
    expect(TestBed.inject(Bag).count()).toBe(0);
  });

  it('lets a client cancel their own order from the top of its page, after saying yes', async () => {
    const { fixture } = await render('/');
    adopt(fixture, AVERY);
    handleShopHttp(
      'POST',
      '/api/orders',
      shirtDraft(),
      `Bearer ${TestBed.inject(ShopSession).token()}`,
    );
    const shirtsLeft = (): number | undefined =>
      (handleShopHttp('GET', '/api/catalog', null, null).body as Product[])
        .flatMap((product) => product.variants)
        .find((variant) => variant.id === 'oxford-shirt-s-white')?.stock;
    const before = shirtsLeft()!;
    await go(fixture, '/order/MR-1001');

    const ask = cancelButton('MR-1001')!;
    expect(ask.textContent?.trim()).toBe('Cancel');
    expect(ask.closest('.head__top')?.querySelector('h1')?.textContent).toContain('Order MR-1001');
    expect(ask.className).toContain('text-destructive');

    // As from the keyboard: focus is on the button when it opens the dialog, so it comes back there.
    ask.focus();
    ask.click();
    await settle(fixture);
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
      'Cancel order MR-1001?',
    );
    expect(document.activeElement?.textContent).toContain('Keep the order');
    await clickButton(fixture, 'Keep the order');
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(document.activeElement).toBe(cancelButton('MR-1001'));

    cancelButton('MR-1001')!.click();
    await settle(fixture);
    await clickButton(fixture, 'Yes, cancel the order');

    expect(document.body.textContent).toContain('This order was cancelled.');
    expect(document.activeElement?.textContent).toContain('Order MR-1001 is cancelled');
    expect(cancelButton('MR-1001')).toBeNull();
    expect(shirtsLeft()).toBe(before + 1);
  });

  it("opens a signed-in client's order straight after a reload", async () => {
    const signedIn = openSession(AVERY);
    handleShopHttp('POST', '/api/orders', shirtDraft(), `Bearer ${signedIn.token}`);
    localStorage.setItem('marlow.session', signedIn.token);

    await render('/order/MR-1001');

    expect(document.body.textContent).toContain('Order MR-1001');
    expect(document.body.textContent).not.toContain('That order is not available');
  });

  it('tells a guest to ask the shop, since a guest order has no account to cancel it from', async () => {
    handleShopHttp('POST', '/api/orders', shirtDraft(), null);
    await render('/order/MR-1001');

    expect(document.body.textContent).toContain('Order MR-1001');
    expect(cancelButton('MR-1001')).toBeNull();
    expect(document.body.textContent).toContain('give the shop the reference');
  });

  it('shows a bank transfer as pending, and says the bank details went by email', async () => {
    handleShopHttp('POST', '/api/orders', shirtDraft(), null);
    handleShopHttp('POST', '/api/orders', { ...shirtDraft(), paymentMethod: 'shop-floor' }, null);

    const { fixture } = await render('/order/MR-1001');
    expect(document.querySelector('.head')?.textContent).toContain('Payment pending');
    expect(document.body.textContent).toContain(
      'We emailed the bank details (account name and IBAN) to ada@example.com.',
    );
    expect(paymentFact()).toBe('Bank transfer');

    await go(fixture, '/order/MR-1002');
    expect(document.body.textContent).not.toContain('Payment pending');
    expect(document.body.textContent).not.toContain('We emailed the bank details');
  });

  it('pays a bank transfer at the simulated bank, and the order then reads as paid', async () => {
    const order = handleShopHttp('POST', '/api/orders', shirtDraft(), null).body as ShopOrder;
    const { fixture } = await render(transferPathOf(order)!);

    const bank = document.body.textContent ?? '';
    expect(bank).toContain('Sandbox Bank');
    expect(bank).toContain('Marlow Ready-to-Wear Ltd');
    expect(bank).toContain('GB94 SNDB 2026 1015 0000 42');
    expect(bank).toContain('MR-1001');
    expect(bank).toContain('No money moves');

    await clickButton(fixture, `Send ${formatMoney(order.totalCents)}`);
    expect(document.body.textContent).toContain('Transfer sent');
    expect(document.activeElement?.textContent).toContain('Transfer sent');
    expect(findButton('Send')).toBeUndefined();

    await go(fixture, '/order/MR-1001');
    expect(document.querySelector('.head')?.textContent).toContain('Paid');
    expect(document.body.textContent).not.toContain('Payment pending');
    expect(paymentFact()).toBe('Bank transfer');
  });

  it('turns away a payment link the shop did not sign', async () => {
    handleShopHttp('POST', '/api/orders', shirtDraft(), null);
    await render('/bank/MR-1001/made-up-code');

    expect(document.body.textContent).toContain('That payment link is not valid.');
    expect(findButton('Send')).toBeUndefined();
  });

  it('marks a pending transfer in the client list and on the desk', async () => {
    const { fixture } = await render('/');
    adopt(fixture, AVERY);
    handleShopHttp(
      'POST',
      '/api/orders',
      shirtDraft(),
      `Bearer ${TestBed.inject(ShopSession).token()}`,
    );
    await go(fixture, '/account/orders');
    expect(document.querySelector('main')?.textContent).toContain('Payment pending');

    adopt(fixture, JORDAN);
    await go(fixture, '/desk');
    expect(document.querySelector('main table')?.textContent).toContain('Payment pending');
  });

  it('sorts and searches the client orders from the address, and clears it all at once', async () => {
    const { fixture } = await render('/');
    adopt(fixture, AVERY);
    const signedIn = `Bearer ${TestBed.inject(ShopSession).token()}`;
    const withLines = (lines: { productId: string; variantId: string; quantity: number }[]) => ({
      ...shirtDraft(),
      lines,
    });
    handleShopHttp('POST', '/api/orders', shirtDraft(), signedIn);
    handleShopHttp(
      'POST',
      '/api/orders',
      withLines([
        { productId: 'wool-overcoat', variantId: 'wool-overcoat-46-charcoal', quantity: 1 },
      ]),
      signedIn,
    );
    handleShopHttp(
      'POST',
      '/api/orders',
      withLines([{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 2 }]),
      signedIn,
    );
    const location = TestBed.inject(Location);

    await go(fixture, '/account/orders?sort=price&dir=asc');
    expect(listedReferences()).toEqual(['MR-1001', 'MR-1003', 'MR-1002']);
    expect((document.getElementById('orders-sort') as HTMLSelectElement).value).toBe('price-asc');
    expect(document.querySelector('.order time')?.getAttribute('datetime')).toMatch(/^2\d{3}-/);

    await pick(fixture, 'orders-sort', 'price-desc');
    expect(listedReferences()).toEqual(['MR-1002', 'MR-1003', 'MR-1001']);
    expect(location.path()).toBe('/account/orders?sort=price&dir=desc');

    await typeInto(fixture, 'orders-reference', 'mr1003');
    expect(listedReferences()).toEqual(['MR-1003']);
    expect(location.path()).toBe('/account/orders?reference=mr1003&sort=price&dir=desc');
    expect(document.body.textContent).toContain('1 of 3 orders');

    await typeInto(fixture, 'orders-reference', '9999');
    expect(listedReferences()).toEqual([]);
    expect(document.body.textContent).toContain('No order matches “9999”.');

    await clickButton(fixture, 'Clear filters');
    expect(location.path()).toBe('/account/orders');
    expect(listedReferences()).toEqual(['MR-1003', 'MR-1002', 'MR-1001']);
    expect(findButton('Clear filters')).toBeUndefined();
    expect(document.activeElement?.id).toBe('orders-reference');
    expect((document.getElementById('orders-reference') as HTMLInputElement).value).toBe('');
  });

  it('goes Back through the history when the shopper came from another page of the shop', async () => {
    const { fixture } = await render('/category/shirts');
    await go(fixture, '/product/oxford-shirt');
    // The test bed keeps its own history; the walk back itself is the browser's, checked end to end.
    const back = vi.spyOn(TestBed.inject(Location), 'back').mockImplementation(() => undefined);

    backLink()!.click();
    await settle(fixture);

    expect(back).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/product/oxford-shirt');
  });

  it('goes Back to somewhere sensible when the page was opened from outside the shop', async () => {
    const { fixture } = await render('/product/oxford-shirt');
    expect(backLink()?.getAttribute('href')).toBe('/category/shirts');
    expect(document.body.textContent).toContain(
      'pay at the shop, in cash on delivery, or by bank transfer through a secure platform',
    );

    backLink()!.click();
    await settle(fixture);
    expect(TestBed.inject(Router).url).toBe('/category/shirts');

    handleShopHttp('POST', '/api/orders', shirtDraft(), null);
    await render('/order/MR-1001');
    expect(backLink()?.getAttribute('href')).toBe('/');

    const { fixture: signedIn } = await render('/');
    adopt(signedIn, AVERY);
    handleShopHttp(
      'POST',
      '/api/orders',
      shirtDraft(),
      `Bearer ${TestBed.inject(ShopSession).token()}`,
    );
    await go(signedIn, '/order/MR-1002');
    expect(backLink()?.getAttribute('href')).toBe('/account/orders');
  });

  it('shows the same trail on a category page as on a piece', async () => {
    const { fixture } = await render('/category/shirts');
    expect(breadcrumbTrail()).toEqual([
      ['Shop', '/'],
      ['Shirts', null],
    ]);

    await go(fixture, '/product/oxford-shirt');
    expect(breadcrumbTrail()).toEqual([
      ['Shop', '/'],
      ['Shirts', '/category/shirts'],
      ['Oxford Cloth Shirt', null],
    ]);
  });

  it('refuses clients at both staff areas and workers at the backoffice', async () => {
    const { fixture } = await render('/owner');
    expect(document.body.textContent).toContain('closed to you');

    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('closed to you');

    adopt(fixture, AVERY);
    await go(fixture, '/owner');
    expect(document.body.textContent).toContain('closed to you');
    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('closed to you');

    adopt(fixture, JORDAN);
    await go(fixture, '/owner/pieces');
    expect(document.body.textContent).toContain('closed to you');
    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('Daily desk');
    await go(fixture, '/desk/stock');
    expect(document.body.textContent).toContain('On hand');
    expect(document.getElementById('piece-price')).toBeNull();

    adopt(fixture, SLOAN);
    await go(fixture, '/owner');
    expect(document.body.textContent).toContain('Every order');
    await go(fixture, '/owner/pieces');
    expect(document.getElementById('piece-price')).not.toBeNull();
  });
});

async function render(url: string): Promise<{ fixture: ComponentFixture<App> }> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withInterceptors([shopApiInterceptor])),
      { provide: NeonAuth, useClass: SignedOutNeonAuth },
    ],
  });
  const fixture = TestBed.createComponent(App);
  await go(fixture, url);
  return { fixture };
}

/** Lets navigation, the stubbed API's promises, and the renders they cause all finish. */
async function settle(fixture: ComponentFixture<App>): Promise<void> {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
}

async function go(fixture: ComponentFixture<App>, url: string): Promise<void> {
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
}

/** Neon Auth without a network: every account is a Neon account, so signing out tells it too. */
class SignedOutNeonAuth {
  async signOut(): Promise<void> {}
  async currentSessionToken(): Promise<string | null> {
    return null;
  }
}

/** Signed in as the server signs in a Neon account, with the role the database gave it. */
function adopt(fixture: ComponentFixture<App>, actor: Actor): void {
  const { token } = openSession(actor);
  fixture.componentRef.injector.get(ShopSession).adopt(actor, token);
}

function shirtDraft() {
  return {
    contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '5550148' },
    shipping: {
      line1: '12 Loom Street',
      city: 'Providence',
      region: 'Rhode Island',
      postalCode: '02903',
      country: 'United States',
    },
    paymentMethod: 'bank-transfer',
    lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 1 }],
  };
}

/** The order page's Payment fact: the method alone, since the badges carry its state. */
function paymentFact(): string | undefined {
  const label = [...document.querySelectorAll('dt')].find(
    (term) => term.textContent?.trim() === 'Payment',
  );
  return label?.nextElementSibling?.textContent?.trim();
}

function findButton(name: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll('button')].find((item) => item.textContent?.includes(name));
}

async function clickButton(fixture: ComponentFixture<App>, name: string): Promise<void> {
  const button = findButton(name);
  if (!button) {
    throw new Error(`No button named ${name}. Page: ${document.body.textContent?.slice(0, 500)}`);
  }
  button.click();
  await settle(fixture);
}

async function clickLabelled(
  fixture: ComponentFixture<App>,
  within: string,
  label: string,
): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>(
    `${within} button[aria-label="${label}"]`,
  );
  if (!button) {
    throw new Error(`No button labelled ${label} in ${within}.`);
  }
  button.click();
  await settle(fixture);
}

async function choose(fixture: ComponentFixture<App>, selector: string): Promise<void> {
  const radio = document.querySelector<HTMLInputElement>(selector);
  if (!radio) {
    throw new Error(`No option ${selector}. Page: ${document.body.textContent?.slice(0, 500)}`);
  }
  radio.click();
  radio.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
}

async function checkoutWithAShirt(): Promise<{ fixture: ComponentFixture<App> }> {
  const rendered = await render('/product/oxford-shirt');
  await choose(rendered.fixture, 'input[name="size"][value="M"]');
  await clickButton(rendered.fixture, 'Add to bag');
  await go(rendered.fixture, '/checkout');
  return rendered;
}

/** Each step of the breadcrumb as [label, link]; the page itself has no link and is marked current. */
function breadcrumbTrail(): [string, string | null][] {
  const steps = document.querySelectorAll<HTMLElement>(
    'nav[aria-label="Breadcrumb"] a, nav[aria-label="Breadcrumb"] [aria-current="page"]',
  );
  return [...steps].map((step) => [step.textContent?.trim() ?? '', step.getAttribute('href')]);
}

function backLink(): HTMLAnchorElement | null {
  return document.querySelector('app-back-link a');
}

/** The order page's Cancel button: its name says which order, after the word it shows. */
function cancelButton(reference: string): HTMLButtonElement | null {
  return document.querySelector(`button[aria-label="Cancel order ${reference}"]`);
}

/** The references the client's order list shows, top to bottom. */
function listedReferences(): string[] {
  return [...document.querySelectorAll('.order__reference')].map(
    (reference) => reference.textContent?.trim() ?? '',
  );
}

/** The error a field shows, or undefined while it shows none. */
function fieldError(id: string): string | undefined {
  return document.getElementById(`${id}-error`)?.textContent?.trim();
}

function labelOf(id: string): string | undefined {
  return document.querySelector(`label[for="${id}"]`)?.textContent?.trim();
}

async function pick(fixture: ComponentFixture<App>, id: string, option: string): Promise<void> {
  const select = document.getElementById(id);
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`No select ${id}. Page: ${document.body.textContent?.slice(0, 500)}`);
  }
  select.value = option;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  select.dispatchEvent(new Event('blur'));
  await settle(fixture);
}

/** Types into the country search, as a shopper would, and picks the country from what it lists. */
async function chooseCountry(
  fixture: ComponentFixture<App>,
  typed: string,
  country: string,
): Promise<void> {
  await typeInto(fixture, 'ship-country', typed);
  await settle(fixture);
  const option = [...document.querySelectorAll<HTMLElement>('[data-slot="combobox-item"]')].find(
    (item) => item.textContent?.trim() === country && !item.hasAttribute('data-hidden'),
  );
  if (!option) {
    throw new Error(`${country} is not listed for "${typed}".`);
  }
  option.click();
  await settle(fixture);
}

async function typeInto(fixture: ComponentFixture<App>, id: string, value: string): Promise<void> {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No field ${id}. Page: ${document.body.textContent?.slice(0, 500)}`);
  }
  input.focus();
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur'));
  await fixture.whenStable();
}
