import { DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * A row of full-width slides that the shopper swipes sideways, one at a time. It reports which slide
 * is in view and brings back a chosen one. Snapping and scroll speed stay in CSS, so a shopper who
 * asks for reduced motion gets an instant jump.
 */
@Directive({
  selector: '[appSlideTrack]',
  exportAs: 'slideTrack',
})
export class SlideTrack {
  private readonly track = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly currentSlide = signal(0);

  /** The slide in view. The server renders the first. */
  readonly current = this.currentSlide.asReadonly();

  constructor() {
    this.followSwipes();
  }

  show(index: number): void {
    this.track.scrollTo({ left: index * this.track.clientWidth });
  }

  /** The slide after the one in view, or the first again after the last. */
  showNext(): void {
    this.show((this.current() + 1) % this.track.children.length);
  }

  /** A plain listener, so swiping only re-renders when the slide in view changes. */
  private followSwipes(): void {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = (): void =>
        this.currentSlide.set(slideAt(this.track.scrollLeft, this.track.clientWidth));
      this.track.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => this.track.removeEventListener('scroll', onScroll));
    });
  }
}

/** The slide that fills most of a track scrolled this far, when every slide is as wide as the track. */
export function slideAt(scrollLeft: number, slideWidth: number): number {
  return slideWidth > 0 ? Math.round(scrollLeft / slideWidth) : 0;
}
