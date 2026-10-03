import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  async function renderAt(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the home page inside the layout', async () => {
    const element = await renderAt('/');

    expect(element.querySelector('header a')?.textContent).toContain('angular-neon-agent-template');
    expect(element.querySelector('main h1')?.textContent).toContain('Your Angular app is running');
    expect(document.title).toBe('Home | angular-neon-agent-template');
  });

  it('sends unknown URLs to the home page', async () => {
    await renderAt('/does-not-exist');

    expect(TestBed.inject(Router).url).toBe('/');
  });
});
