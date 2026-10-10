import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Reveal } from './reveal';

@Component({
  imports: [Reveal],
  template: `<p appReveal [revealOrder]="2">A row of pieces</p>`,
})
class RevealHost {}

/** Stands in for the browser's observer, so a test decides when the paragraph reaches the viewport. */
class FakeObserver {
  static latest: FakeObserver | null = null;
  disconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeObserver.latest = this;
  }

  observe(): void {}

  disconnect(): void {
    this.disconnected = true;
  }

  report(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

describe('Reveal', () => {
  let reducedMotion = false;

  beforeEach(() => {
    reducedMotion = false;
    FakeObserver.latest = null;
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reducedMotion, media: query }));
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(RevealHost);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('p') as HTMLElement;
  }

  it('waits below the fold and rises once it scrolls into view', async () => {
    const paragraph = await render();

    FakeObserver.latest!.report(false);
    TestBed.tick();
    expect(paragraph.getAttribute('data-reveal')).toBe('pending');
    expect(paragraph.style.getPropertyValue('--reveal-delay')).toBe('140ms');

    FakeObserver.latest!.report(true);
    TestBed.tick();
    expect(paragraph.getAttribute('data-reveal')).toBe('shown');
    expect(FakeObserver.latest!.disconnected).toBe(true);
  });

  it('leaves content that starts on screen alone', async () => {
    const paragraph = await render();

    FakeObserver.latest!.report(true);
    TestBed.tick();

    expect(paragraph.hasAttribute('data-reveal')).toBe(false);
    expect(FakeObserver.latest!.disconnected).toBe(true);
  });

  it('never hides anything when the shopper asks for less motion', async () => {
    reducedMotion = true;

    const paragraph = await render();

    expect(FakeObserver.latest).toBeNull();
    expect(paragraph.hasAttribute('data-reveal')).toBe(false);
  });
});
