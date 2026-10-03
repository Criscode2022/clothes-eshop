import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('walks through connecting the agent in order', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const steps = [...element.querySelectorAll('ol.steps > li h3')].map((step) =>
      step.textContent!.trim(),
    );

    expect(element.querySelector('h1')!.textContent).toContain('Your Angular app is running');
    expect(steps).toEqual([
      'Approve the MCP servers',
      'Sign in to Neon',
      'Ask for a schema',
      'Swap the data source',
    ]);
  });

  it('shows the notes placeholder feature', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-notes-panel h2')!.textContent).toContain('Notes');
  });
});
