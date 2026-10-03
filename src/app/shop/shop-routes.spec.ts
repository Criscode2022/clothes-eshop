import { HttpErrorResponse, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { of, throwError } from 'rxjs';
import { App } from '../app';
import { routes } from '../app.routes';
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
  const result = handleShopHttp(req.method, url.pathname, req.body, req.headers.get('Authorization'));
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
  });

  it('lets a guest reach confirmation without signing in', async () => {
    const { fixture } = await render('/product/oxford-shirt');
    await clickButton(fixture, 'Add to bag');

    await go(fixture, '/checkout');
    expect(document.body.textContent).toContain('An account is optional');

    await typeInto(fixture, 'contact-name', 'Ada Lovelace');
    await typeInto(fixture, 'contact-email', 'ada@example.com');
    await typeInto(fixture, 'contact-phone', '5550148');
    await clickButton(fixture, 'Continue to shipping');

    await typeInto(fixture, 'ship-line1', '12 Loom Street');
    await typeInto(fixture, 'ship-city', 'Providence');
    await typeInto(fixture, 'ship-postal', '02903');
    await clickButton(fixture, 'Continue to review');

    await clickButton(fixture, 'Continue to payment');

    const radio = document.querySelector<HTMLInputElement>('input[value="bank-transfer"]');
    expect(radio).not.toBeNull();
    radio!.checked = true;
    radio!.dispatchEvent(new Event('input', { bubbles: true }));
    radio!.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    await clickButton(fixture, 'Place order');

    const quote = quoteOrder(
      [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 1 }],
      SEED_PRODUCTS,
    );
    expect(quote.totalCents).toBe(quote.subtotalCents + quote.shippingCents);
    expect(document.body.textContent).toContain('MR-1001');
    expect(document.body.textContent).toContain('Oxford Cloth Shirt');
    expect(document.body.textContent).toContain('Bank transfer');
    expect(document.body.textContent).toContain(formatMoney(quote.totalCents));
    expect(TestBed.inject(Router).url).toBe('/order/MR-1001');
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
    await go(fixture, '/owner');
    expect(document.body.textContent).toContain('closed to you');
    await go(fixture, '/desk');
    expect(document.body.textContent).toContain('Daily desk');
    expect(document.querySelector('[aria-label="Price in cents"]')).toBeNull();

    adopt(fixture, 'sloan@marlow.shop');
    await go(fixture, '/owner');
    expect(document.body.textContent).toContain('Every order');
    expect(document.querySelector('[aria-label="Price in cents"]')).not.toBeNull();
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

async function go(fixture: ComponentFixture<App>, url: string): Promise<void> {
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
}

function adopt(fixture: ComponentFixture<App>, email: string): void {
  const result = handleShopHttp('POST', '/api/session', { email, password: FLOOR_PASSWORD_HINT }, null);
  const body = result.body as { token: string; actor: Actor };
  fixture.componentRef.injector.get(ShopSession).adopt(body.actor, body.token);
}

async function clickButton(fixture: ComponentFixture<App>, name: string): Promise<void> {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes(name));
  if (!button) {
    throw new Error(`No button named ${name}. Page: ${document.body.textContent?.slice(0, 500)}`);
  }
  button.click();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
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
  await fixture.whenStable();
}
