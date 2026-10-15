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
import { handleShopHttp, openSession, resetShopServer } from './shop-server';
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

  it('lets a client cancel their own order from its page, after saying yes', async () => {
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

    await clickButton(fixture, 'Cancel this order');
    expect(document.body.textContent).toContain('Cancel order MR-1001?');
    expect(document.activeElement?.textContent).toContain('Yes, cancel the order');
    await clickButton(fixture, 'Keep the order');
    expect(document.activeElement?.textContent).toContain('Cancel this order');

    await clickButton(fixture, 'Cancel this order');
    await clickButton(fixture, 'Yes, cancel the order');

    expect(document.body.textContent).toContain('This order was cancelled.');
    expect(document.activeElement?.textContent).toContain('Order MR-1001 is cancelled');
    expect(findButton('Cancel this order')).toBeUndefined();
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
    expect(findButton('Cancel this order')).toBeUndefined();
    expect(document.body.textContent).toContain('give the shop the reference');
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
      postalCode: '02903',
      country: 'United States',
    },
    paymentMethod: 'bank-transfer',
    lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 1 }],
  };
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
