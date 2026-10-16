import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  async function renderAt(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('opens on the whole floor, with every piece and its price', async () => {
    const element = await renderAt('/');

    expect(element.querySelector('header a')?.textContent).toContain('Marlow');
    expect(element.querySelector('main h1')?.textContent).toContain('A small ready-to-wear floor');
    expect(element.querySelectorAll('main app-product-card')).toHaveLength(8);
    expect(element.querySelector('main')?.textContent).toContain('Charcoal Wool Overcoat');
    expect(element.querySelector('main')?.textContent).toContain('$420.00');
    expect(element.querySelector('main')?.textContent).toContain('$89.00');
    expect(document.title).toBe('Shop | Marlow');
  });

  it('loads the opening three photographs with the page and leaves the rest until they are near', async () => {
    const element = await renderAt('/');
    const spread = [...element.querySelectorAll('.spread img')];
    const cards = [...element.querySelectorAll('app-product-card img')];
    const below = [...element.querySelectorAll('.note img, .room img')];

    expect(spread).toHaveLength(3);
    expect(spread[0]?.getAttribute('fetchpriority')).toBe('high');
    expect(spread.map((img) => img.getAttribute('loading'))).toEqual(['eager', 'eager', 'eager']);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
    expect(cards.every((img) => img.getAttribute('fetchpriority') !== 'high')).toBe(true);
    expect(below.length).toBeGreaterThan(0);
    expect(below.every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
  });

  it('loads the first two photographs of a category with the page', async () => {
    const element = await renderAt('/category/outerwear');
    const cards = [...element.querySelectorAll('app-product-card img')];

    expect(cards.length).toBeGreaterThan(0);
    for (const [index, img] of cards.entries()) {
      expect(img.getAttribute('loading')).toBe(index < 2 ? 'eager' : 'lazy');
      expect(img.getAttribute('fetchpriority')).toBe(index < 2 ? 'high' : null);
    }
  });

  it('shows one category with its fit note', async () => {
    const element = await renderAt('/category/knitwear');

    expect(element.querySelector('main h1')?.textContent).toContain('Knitwear');
    expect(element.querySelectorAll('main app-product-card')).toHaveLength(2);
    expect(element.querySelector('main')?.textContent).toContain('The merino sits close.');
  });

  it('sends unknown URLs to the home page', async () => {
    await renderAt('/does-not-exist');

    expect(TestBed.inject(Router).url).toBe('/');
  });
});
