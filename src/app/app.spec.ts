import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  async function renderAt(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the home page inside the layout', async () => {
    const element = await renderAt('/');

    expect(element.querySelector('header a')?.textContent).toContain('Marlow');
    expect(element.querySelector('main h1')?.textContent).toContain('Charcoal Wool Overcoat');
    expect(element.querySelector('main')?.textContent).toContain('Oxford Cloth Shirt');
    expect(element.querySelector('main')?.textContent).toContain('$420.00');
    expect(element.querySelector('main')?.textContent).toContain('$89.00');
    expect(document.title).toBe('Shop | Marlow');
  });

  it('sends unknown URLs to the home page', async () => {
    await renderAt('/does-not-exist');

    expect(TestBed.inject(Router).url).toBe('/');
  });
});
