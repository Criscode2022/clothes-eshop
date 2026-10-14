import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlideShow } from './slide-show';
import { SlideTrack } from './slide-track';

const SLIDE_WIDTH = 390;
const INTERVAL_MS = 6000;

@Component({
  imports: [SlideShow, SlideTrack],
  template: `
    <ul appSlideTrack appSlideShow #show="slideShow">
      <li><a href="/first">First</a></li>
      <li>Second</li>
      <li>Third</li>
    </ul>
    <p>{{ show.state() }}</p>
    <button type="button" (click)="show.toggle()">Pause or play</button>
  `,
})
class ShowHost {}

/** Stands in for the browser's observers, so a test decides what the shopper can see. */
class FakeObserver {
  static readonly latest = new Map<string, FakeObserver>();

  constructor(
    private readonly kind: string,
    private readonly callback: (entries: unknown[]) => void,
  ) {
    FakeObserver.latest.set(kind, this);
  }

  observe(): void {}

  disconnect(): void {}

  report(entry: object = {}): void {
    this.callback([entry]);
  }
}

describe('SlideShow', () => {
  let reducedMotion = false;

  beforeEach(() => {
    reducedMotion = false;
    FakeObserver.latest.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reducedMotion, media: query }));
    vi.stubGlobal(
      'IntersectionObserver',
      class extends FakeObserver {
        constructor(callback: (entries: unknown[]) => void) {
          super('intersection', callback);
        }
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class extends FakeObserver {
        constructor(callback: (entries: unknown[]) => void) {
          super('resize', callback);
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'hidden');
  });

  function render() {
    const fixture = TestBed.createComponent(ShowHost);
    const host = fixture.nativeElement as HTMLElement;
    const track = host.querySelector('ul')!;
    Object.defineProperty(track, 'clientWidth', { value: SLIDE_WIDTH });
    Object.defineProperty(track, 'scrollWidth', { value: 3 * SLIDE_WIDTH, configurable: true });
    const scrollTo = vi.fn(({ left }: { left: number }) => scrollTrack(left));
    track.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];
    TestBed.tick();

    function scrollTrack(left: number): void {
      Object.defineProperty(track, 'scrollLeft', { value: left, configurable: true });
      track.dispatchEvent(new Event('scroll'));
      TestBed.tick();
    }

    function event(target: EventTarget, type: string): void {
      target.dispatchEvent(new Event(type));
      TestBed.tick();
    }

    return {
      host,
      track,
      scrollTo,
      swipeTo: (slide: number) => scrollTrack(slide * SLIDE_WIDTH),
      event,
      state: () => host.querySelector('p')?.textContent,
      toggle: () => {
        host.querySelector('button')!.click();
        TestBed.tick();
      },
    };
  }

  it('shows the next slide after six seconds, and the first again after the last', () => {
    const { scrollTo, state } = render();
    expect(state()).toBe('running');

    vi.advanceTimersByTime(INTERVAL_MS - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: SLIDE_WIDTH });

    vi.advanceTimersByTime(2 * INTERVAL_MS);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0 });
    expect(scrollTo).toHaveBeenCalledTimes(3);
  });

  it('gives a slide the shopper swipes to its full time', () => {
    const { scrollTo, swipeTo } = render();

    vi.advanceTimersByTime(4000);
    swipeTo(1);
    vi.advanceTimersByTime(INTERVAL_MS - 1);

    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: 2 * SLIDE_WIDTH });
  });

  it('waits while a finger rests on the slides, then goes on with the time left', () => {
    const { track, scrollTo, event, state } = render();

    vi.advanceTimersByTime(4000);
    event(track, 'touchstart');
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('held');
    expect(scrollTo).not.toHaveBeenCalled();

    event(track, 'touchend');
    expect(state()).toBe('running');
    vi.advanceTimersByTime(1999);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: SLIDE_WIDTH });
  });

  it('waits while the keyboard is on a slide', () => {
    const { host, scrollTo, state } = render();
    const link = host.querySelector('a')!;

    link.focus();
    TestBed.tick();
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('held');
    expect(scrollTo).not.toHaveBeenCalled();

    link.blur();
    TestBed.tick();
    expect(state()).toBe('running');
  });

  it('pauses, and plays again from the start of the countdown', () => {
    const { scrollTo, state, toggle } = render();

    vi.advanceTimersByTime(4000);
    toggle();
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('stopped');
    expect(scrollTo).not.toHaveBeenCalled();

    toggle();
    expect(state()).toBe('running');
    vi.advanceTimersByTime(INTERVAL_MS - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: SLIDE_WIDTH });
  });

  it('stays still for a shopper who asks for less motion, until they press play', () => {
    reducedMotion = true;
    const { scrollTo, state, toggle } = render();

    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('stopped');
    expect(scrollTo).not.toHaveBeenCalled();

    toggle();
    expect(state()).toBe('running');
  });

  it('waits while nobody can see the slides: scrolled away, or on a hidden tab', () => {
    const { scrollTo, event, state } = render();

    FakeObserver.latest.get('intersection')!.report({ isIntersecting: false });
    TestBed.tick();
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('held');
    FakeObserver.latest.get('intersection')!.report({ isIntersecting: true });
    TestBed.tick();
    expect(state()).toBe('running');

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    event(document, 'visibilitychange');
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('held');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('waits while every slide is in view at once, as on a wide screen', () => {
    const { track, scrollTo, state } = render();

    Object.defineProperty(track, 'scrollWidth', { value: SLIDE_WIDTH, configurable: true });
    FakeObserver.latest.get('resize')!.report();
    TestBed.tick();
    vi.advanceTimersByTime(3 * INTERVAL_MS);
    expect(state()).toBe('held');
    expect(scrollTo).not.toHaveBeenCalled();

    Object.defineProperty(track, 'scrollWidth', { value: 3 * SLIDE_WIDTH, configurable: true });
    FakeObserver.latest.get('resize')!.report();
    TestBed.tick();
    expect(state()).toBe('running');
  });
});
