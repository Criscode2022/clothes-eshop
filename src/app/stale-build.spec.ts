import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withNavigationErrorHandler } from '@angular/router';
import type { Route } from '@angular/router';
import { FULL_PAGE_LOAD, isStaleBuildError, reloadStaleBuild } from './stale-build';

@Component({ template: '' })
class Floor {}

/** What Chrome says when the old build's script is gone from the server. */
const CHROME_MISSING_SCRIPT = new TypeError(
  'Failed to fetch dynamically imported module: https://marlow.shop/chunk-BnLHnQsF.js',
);

describe('a tab left open across a deploy', () => {
  let fullLoads: string[];

  function openShop(checkout: NonNullable<Route['loadComponent']>): Router {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', component: Floor },
            { path: 'checkout', loadComponent: checkout },
          ],
          withNavigationErrorHandler(reloadStaleBuild),
        ),
        { provide: FULL_PAGE_LOAD, useValue: (url: string) => fullLoads.push(url) },
      ],
    });
    return TestBed.inject(Router);
  }

  async function goTo(router: Router, url: string): Promise<void> {
    await router.navigateByUrl(url).catch(() => false);
  }

  beforeEach(() => {
    fullLoads = [];
    sessionStorage.clear();
  });

  afterEach(() => vi.useRealTimers());

  it('loads the page in full when its script belongs to a build the server replaced', async () => {
    const router = openShop(() => Promise.reject(CHROME_MISSING_SCRIPT));

    await goTo(router, '/checkout?from=bag');

    expect(fullLoads).toEqual(['/checkout?from=bag']);
  });

  it('does not reload in a loop when the full load meets the same failure', async () => {
    const router = openShop(() => Promise.reject(CHROME_MISSING_SCRIPT));

    await goTo(router, '/checkout');
    await goTo(router, '/checkout');

    expect(fullLoads).toEqual(['/checkout']);
  });

  it('reloads again for a later deploy', async () => {
    const router = openShop(() => Promise.reject(CHROME_MISSING_SCRIPT));
    await goTo(router, '/checkout');

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 60_000);
    await goTo(router, '/checkout');

    expect(fullLoads).toEqual(['/checkout', '/checkout']);
  });

  it('leaves other navigation errors to the page', async () => {
    const router = openShop(() => Promise.reject(new Error('The shop could not finish that.')));

    await goTo(router, '/checkout');

    expect(fullLoads).toEqual([]);
  });

  it('knows a missing page script in Chrome, Firefox, and Safari', () => {
    expect(
      [
        CHROME_MISSING_SCRIPT,
        new TypeError('error loading dynamically imported module: https://marlow.shop/chunk-A.js'),
        new TypeError('Importing a module script failed.'),
        new Error('That order is not available.'),
        'Failed to fetch dynamically imported module',
      ].map(isStaleBuildError),
    ).toEqual([true, true, true, false, false]);
  });
});
