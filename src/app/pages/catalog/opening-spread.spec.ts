import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OpeningSpread } from './opening-spread';

describe('OpeningSpread', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(OpeningSpread);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('links the three window photographs to their pieces, named with their prices', async () => {
    const host = await render();

    const links = [...host.querySelectorAll('a')];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/product/oxford-shirt',
      '/product/wool-overcoat',
      '/product/field-jacket',
    ]);
    expect(links[1]?.textContent).toContain('Charcoal Wool Overcoat');
    expect(links[1]?.textContent).toContain('$');
  });

  it('gives each photograph a marker on a phone and marks the first as the one in view', async () => {
    const host = await render();

    const markers = [...host.querySelectorAll('[role="group"][aria-label="Photographs"] button')];

    expect(markers.map((marker) => marker.textContent?.trim())).toEqual([
      'Show Oxford Cloth Shirt',
      'Show Charcoal Wool Overcoat',
      'Show Camel Field Jacket',
    ]);
    expect(markers.map((marker) => marker.getAttribute('aria-current'))).toEqual([
      'true',
      null,
      null,
    ]);
  });
});
