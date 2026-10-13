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
import { FLOOR_PASSWORD_HINT, handleShopHttp, resetShopServer } from './shop-server';
import { ShopSession } from './shop-session';
import type { Actor } from './access';

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

  it('shows the piece in the color the shopper picks', async () => {
    const { fixture } = await render('/product/wool-overcoat');
    const photo = (): HTMLImageElement | null => document.querySelector('.pdp__media img');

    expect(photo()?.getAttribute('src')).toBe('/garments/wool-overcoat.jpg');
    expect(photo()?.alt).toBe('Charcoal Wool Overcoat in Charcoal');

    await choose(fixture, 'input[name="color"][value="Camel"]');

    expect(photo()?.getAttribute('src')).toBe('/garments/wool-overcoat-camel.jpg');
    expect(photo()?.alt).toBe('Charcoal Wool Overcoat in Camel');
  });

  it('asks for a size instead of guessing one', async () => {
    const { fixture } = await render('/product/oxford-shirt');

    await clickButton(fixture, 'Add to bag');

    expect(document.body.textContent).toContain('Choose a size to add it to your bag.');
    expect(TestBed.inject(Bag).count()).toBe(0);
  });

  it('refuses clients at both staff areas and workers at the backoffice', async () => {
    const { fixture } = await render('/owner');
    expect(document.body.textContent).toContain('closed to you');

    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('closed to you');

    adopt(fixture, 'avery@marlow.shop');
    await go(fixture, '/owner');
    expect(document.body.textContent).toContain('closed to you');
    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('closed to you');

    adopt(fixture, 'jordan@marlow.shop');
    await go(fixture, '/owner/pieces');
    expect(document.body.textContent).toContain('closed to you');
    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('Daily desk');
    await go(fixture, '/desk/stock');
    expect(document.body.textContent).toContain('On hand');
    expect(document.getElementById('piece-price')).toBeNull();

    adopt(fixture, 'sloan@marlow.shop');
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

function adopt(fixture: ComponentFixture<App>, email: string): void {
  const result = handleShopHttp(
    'POST',
    '/api/session',
    { email, password: FLOOR_PASSWORD_HINT },
    null,
  );
  const body = result.body as { token: string; actor: Actor };
  fixture.componentRef.injector.get(ShopSession).adopt(body.actor, body.token);
}

async function clickButton(fixture: ComponentFixture<App>, name: string): Promise<void> {
  const button = [...document.querySelectorAll('button')].find((item) =>
    item.textContent?.includes(name),
  );
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
