import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { prefersReducedMotion } from './motion';
import { SlideTrack } from './slide-track';

/** How long each slide stays before the next one slides in. */
const INTERVAL_MS = 6000;

/** Why the slides wait without the shopper pressing pause. Until the browser starts them, they are loading. */
type Hold = 'loading' | 'touch' | 'focus' | 'scrolled-away' | 'hidden-tab' | 'side-by-side';

/** Running: the slides take turns. Held: the countdown waits where it is. Stopped: paused, by the shopper or for reduced motion. */
export type SlideShowState = 'running' | 'held' | 'stopped';

/**
 * Lets the slides of a `SlideTrack` take turns. Each slide stays six seconds, counted from the start
 * again when the shopper swipes to or picks another. The countdown waits while a finger or the
 * keyboard is on the slides and while nobody can see them, and the shopper can pause it. Shoppers who
 * ask for reduced motion start paused.
 */
@Directive({
  selector: '[appSlideTrack][appSlideShow]',
  exportAs: 'slideShow',
  host: {
    '(focusin)': 'hold("focus")',
    '(focusout)': 'releaseFocus($event)',
  },
})
export class SlideShow {
  /** The countdown's length, for the marker that draws it. */
  readonly intervalMs = INTERVAL_MS;

  private readonly slides = inject(SlideTrack);
  private readonly track = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isPlaying = signal(true);
  private readonly holds = signal<ReadonlySet<Hold>>(new Set(['loading']));
  private readonly countdown = new Countdown(INTERVAL_MS, () => this.slides.showNext());

  /** The server renders the slides waiting to start; the browser starts them unless motion is reduced. */
  readonly playing = this.isPlaying.asReadonly();
  readonly state = computed<SlideShowState>(() => {
    if (!this.isPlaying()) {
      return 'stopped';
    }
    return this.holds().size > 0 ? 'held' : 'running';
  });

  constructor() {
    effect(() => {
      this.slides.current();
      untracked(() => this.countdown.restart());
    });
    effect(() => {
      if (this.state() === 'running') {
        this.countdown.resume();
      } else {
        this.countdown.pause();
      }
    });
    this.destroyRef.onDestroy(() => this.countdown.pause());
    afterNextRender(() => {
      this.waitWhileTouched();
      this.waitWhileScrolledAway();
      this.waitWhileTabHidden();
      this.waitWhileSideBySide();
      this.isPlaying.set(!prefersReducedMotion());
      this.release('loading');
    });
  }

  /** Pauses the slides, or plays them again from the start of the countdown. */
  toggle(): void {
    if (!this.isPlaying()) {
      this.countdown.restart();
    }
    this.isPlaying.update((playing) => !playing);
  }

  protected hold(reason: Hold): void {
    this.holds.update((holds) => new Set(holds).add(reason));
  }

  protected releaseFocus(event: FocusEvent): void {
    if (!this.track.contains(event.relatedTarget as Node | null)) {
      this.release('focus');
    }
  }

  private release(reason: Hold): void {
    this.holds.update((holds) => {
      const remaining = new Set(holds);
      remaining.delete(reason);
      return remaining;
    });
  }

  private holdWhile(reason: Hold, isHolding: boolean): void {
    if (isHolding) {
      this.hold(reason);
    } else {
      this.release(reason);
    }
  }

  /** Passive listeners, so the countdown never slows a swipe down. */
  private waitWhileTouched(): void {
    const onLift = (): void => this.release('touch');
    this.listen(this.track, 'touchstart', () => this.hold('touch'));
    this.listen(this.track, 'touchend', onLift);
    this.listen(this.track, 'touchcancel', onLift);
  }

  private waitWhileScrolledAway(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(([entry]) =>
      this.holdWhile('scrolled-away', !entry?.isIntersecting),
    );
    observer.observe(this.track);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private waitWhileTabHidden(): void {
    this.listen(this.document, 'visibilitychange', () =>
      this.holdWhile('hidden-tab', this.document.hidden),
    );
  }

  /** A wide screen shows every slide at once, so none of them needs to wait its turn. */
  private waitWhileSideBySide(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() =>
      this.holdWhile('side-by-side', this.track.scrollWidth <= this.track.clientWidth),
    );
    observer.observe(this.track);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private listen(target: EventTarget, type: string, listener: () => void): void {
    target.addEventListener(type, listener, { passive: true });
    this.destroyRef.onDestroy(() => target.removeEventListener(type, listener));
  }
}

/**
 * The time left on one slide. It can wait and go on with what is left, as the marker's fill does,
 * and when it runs out it starts over by itself, so the slides keep taking turns.
 */
class Countdown {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private startedAt = 0;
  private left: number;

  constructor(
    private readonly length: number,
    private readonly onEnd: () => void,
  ) {
    this.left = length;
  }

  /** Back to the full length, still running if it was. */
  restart(): void {
    const wasRunning = this.timer !== undefined;
    this.pause();
    this.left = this.length;
    if (wasRunning) {
      this.resume();
    }
  }

  pause(): void {
    if (this.timer === undefined) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = undefined;
    this.left -= Date.now() - this.startedAt;
  }

  resume(): void {
    if (this.timer !== undefined) {
      return;
    }
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.end(), Math.max(this.left, 0));
  }

  private end(): void {
    this.timer = undefined;
    this.left = this.length;
    this.resume();
    this.onEnd();
  }
}
