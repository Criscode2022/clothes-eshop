import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { prefersReducedMotion } from './motion';

type RevealState = 'pending' | 'shown';

/** Siblings arrive one after another, but never more than this many steps apart. */
const MAX_STAGGER_STEPS = 4;
const STAGGER_MS = 70;

/**
 * Lets a section or a row of pieces rise into place the first time it scrolls into view.
 * Content that starts on screen, server-rendered pages before hydration, and shoppers who ask for
 * reduced motion all see it in place: only what is still below the fold is ever hidden.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[attr.data-reveal]': 'state()',
    '[style.--reveal-delay]': 'delay()',
  },
})
export class Reveal {
  /** Position among siblings that arrive together, such as a piece's column in the grid. */
  readonly revealOrder = input(0);

  protected readonly state = signal<RevealState | null>(null);
  protected readonly delay = computed(
    () => `${Math.min(this.revealOrder(), MAX_STAGGER_STEPS) * STAGGER_MS}ms`,
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!canReveal()) {
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            observer.disconnect();
            this.state.update((state) => (state === 'pending' ? 'shown' : state));
          } else {
            this.state.update((state) => state ?? 'pending');
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

function canReveal(): boolean {
  return typeof IntersectionObserver !== 'undefined' && !prefersReducedMotion();
}
