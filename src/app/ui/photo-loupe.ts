import { Directive, signal } from '@angular/core';

interface Frame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** The point to magnify around, as percentages of the photograph, held inside its edges. */
export function loupeOrigin(
  frame: Frame,
  clientX: number,
  clientY: number,
): { readonly x: string; readonly y: string } {
  const share = (offset: number, length: number): string =>
    `${Math.round(Math.min(Math.max(offset / length, 0), 1) * 100)}%`;
  return {
    x: share(clientX - frame.left, frame.width),
    y: share(clientY - frame.top, frame.height),
  };
}

/**
 * Under a mouse, the photograph magnifies around the pointer so the weave and the buttons can be read.
 * Touch and pen leave it still; nothing on the photograph is only reachable this way.
 */
@Directive({
  selector: '[appPhotoLoupe]',
  host: {
    '[class.is-looking]': 'looking()',
    '[style.--loupe-x]': 'origin().x',
    '[style.--loupe-y]': 'origin().y',
    '(pointerenter)': 'follow($event)',
    '(pointermove)': 'follow($event)',
    '(pointerleave)': 'looking.set(false)',
  },
})
export class PhotoLoupe {
  protected readonly looking = signal(false);
  protected readonly origin = signal({ x: '50%', y: '50%' });

  protected follow(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const frame = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.origin.set(loupeOrigin(frame, event.clientX, event.clientY));
    this.looking.set(true);
  }
}
