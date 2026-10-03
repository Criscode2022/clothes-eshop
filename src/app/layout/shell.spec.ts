import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Shell } from './shell';

@Component({ template: '<h1>First page</h1>' })
class FirstPage {}

@Component({ template: '<h1>Second page</h1>' })
class SecondPage {}

describe('Shell', () => {
  let harness: RouterTestingHarness;

  function main(): HTMLElement {
    return document.querySelector<HTMLElement>('main#main-content')!;
  }

  beforeEach(async () => {
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
});
