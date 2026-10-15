import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BagDrawer } from '../shop/bag-drawer';
import { LOADING_DELAY_MS } from './page-loading';
import { Shell } from './shell';

@Component({ template: '<h1>First page</h1>' })
class FirstPage {}

@Component({ template: '<h1>Second page</h1>' })
class SecondPage {}

/** Holds the slow page back until the test lets it through. */
let openSlowPage: (open: boolean) => void = () => undefined;

describe('Shell', () => {
  let harness: RouterTestingHarness;

  /** What a screen reader hears while a page is on its way. */
  function loadingStatus(): string {
    return document.querySelector('app-page-loading [role="status"]')?.textContent?.trim() ?? '';
  }

  function loadingVeil(): HTMLElement | null {
    return document.querySelector('app-page-loading .veil');
  }

  async function wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    harness.fixture.detectChanges();
  }

  function main(): HTMLElement {
    return document.querySelector<HTMLElement>('main#main-content')!;
  }

  /** The bag sheet, found the way assistive technology finds it: a dialog named by its "Bag" title. */
  function bagSheet(): HTMLElement | null {
    return (
      [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find((dialog) =>
        document
          .getElementById(dialog.getAttribute('aria-labelledby') ?? '')
          ?.textContent?.trim()
          .startsWith('Bag'),
      ) ?? null
    );
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: '', component: FirstPage },
              { path: 'second', component: SecondPage },
              {
                path: 'slow',
                component: SecondPage,
                canActivate: [() => new Promise<boolean>((open) => (openSlowPage = open))],
              },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create('/');
  });

  it('renders routed pages inside the main landmark', () => {
    expect(main().textContent).toContain('First page');
  });

  it('keeps the shipping and payment terms inside a labelled landmark', () => {
    const terms = document.querySelector('aside[aria-label="Shipping and payment"]');

    expect(terms?.textContent).toContain('Free shipping from $200.');
    expect(terms?.textContent).toContain('by bank transfer through a secure platform');
  });

  it('marks the current page in the main navigation', () => {
    const current = document.querySelector('nav[aria-label="Main"] [aria-current="page"]');

    expect(current?.textContent?.trim()).toBe('Shop');
  });

  it('moves focus to the main content from the skip link', () => {
    document.querySelector<HTMLAnchorElement>('.skip-link')!.click();

    expect(document.activeElement).toBe(main());
  });

  it('leaves focus alone on the first load and moves it to the main content after navigating', async () => {
    expect(document.activeElement).not.toBe(main());

    await harness.navigateByUrl('/second');

    expect(main().textContent).toContain('Second page');
    expect(document.activeElement).toBe(main());
  });

  it('opens the bag from the header and closes it when the shopper moves on', async () => {
    const bagButton = [...document.querySelectorAll('header button')].find((button) =>
      button.textContent?.includes('Bag'),
    ) as HTMLButtonElement;

    bagButton.click();
    await harness.fixture.whenStable();
    expect(bagButton.getAttribute('aria-expanded')).toBe('true');
    expect(bagSheet()?.textContent).toContain('Your bag is empty');

    await harness.navigateByUrl('/second');
    await harness.fixture.whenStable();
    expect(bagSheet()).toBeNull();
    expect(bagButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the bag from the footer', async () => {
    const footerBag = [...document.querySelectorAll('footer button')].find(
      (button) => button.textContent?.trim() === 'Bag',
    ) as HTMLButtonElement;

    footerBag.click();
    await harness.fixture.whenStable();

    expect(bagSheet()?.textContent).toContain('Your bag is empty');
  });

  it('offers Keep shopping from an empty bag, and closes it on the same page', async () => {
    const footerBag = [...document.querySelectorAll('footer button')].find(
      (button) => button.textContent?.trim() === 'Bag',
    ) as HTMLButtonElement;
    footerBag.click();
    await harness.fixture.whenStable();
    expect(bagSheet()?.textContent).not.toContain('Shop the floor');

    const keepShopping = [...bagSheet()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Keep shopping',
    ) as HTMLButtonElement;
    keepShopping.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(BagDrawer).isOpen()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(main().textContent).toContain('First page');
  });

  it('closes the bag on the same page when the shopper keeps shopping', async () => {
    TestBed.inject(BagDrawer).add('oxford-shirt', 'oxford-shirt-m-white');
    await harness.fixture.whenStable();
    const keepShopping = [...bagSheet()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Keep shopping',
    ) as HTMLButtonElement;
    expect(bagSheet()!.querySelector('a[href="/bag"]')).toBeNull();

    keepShopping.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(BagDrawer).isOpen()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(main().textContent).toContain('First page');
  });

  it('veils the page with a spinner while a page change is slow, and lifts it when the page arrives', async () => {
    const arriving = harness.navigateByUrl('/slow');

    await wait(LOADING_DELAY_MS + 50);
    expect(loadingVeil()).not.toBeNull();
    expect(loadingStatus()).toBe('Loading the page');

    openSlowPage(true);
    await arriving;
    await harness.fixture.whenStable();
    expect(main().textContent).toContain('Second page');
    expect(loadingVeil()).toBeNull();
    expect(loadingStatus()).toBe('');
  });

  it('never veils a page change that arrives quickly', async () => {
    await harness.navigateByUrl('/second');

    await wait(LOADING_DELAY_MS + 50);
    expect(loadingVeil()).toBeNull();
    expect(loadingStatus()).toBe('');
  });
});
