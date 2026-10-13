import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlideTrack, slideAt } from './slide-track';

const SLIDE_WIDTH = 390;

@Component({
  imports: [SlideTrack],
  template: `
    <ul appSlideTrack #photos="slideTrack">
      <li>First</li>
      <li>Second</li>
      <li>Third</li>
    </ul>
    <p>{{ photos.current() }}</p>
    <button type="button" (click)="photos.show(2)">Show the third</button>
  `,
})
class TrackHost {}

describe('slideAt', () => {
  it('picks the slide that fills most of the track', () => {
    expect(slideAt(0, SLIDE_WIDTH)).toBe(0);
    expect(slideAt(180, SLIDE_WIDTH)).toBe(0);
    expect(slideAt(210, SLIDE_WIDTH)).toBe(1);
    expect(slideAt(780, SLIDE_WIDTH)).toBe(2);
  });

  it('stays on the first slide while the track has no width', () => {
    expect(slideAt(0, 0)).toBe(0);
  });
});

describe('SlideTrack', () => {
  async function render() {
    const fixture = TestBed.createComponent(TrackHost);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const track = host.querySelector('ul')!;
    Object.defineProperty(track, 'clientWidth', { value: SLIDE_WIDTH });
    return { fixture, host, track };
  }

  it('starts on the first slide and follows the swipe', async () => {
    const { fixture, host, track } = await render();
    expect(host.querySelector('p')?.textContent).toBe('0');

    Object.defineProperty(track, 'scrollLeft', { value: SLIDE_WIDTH, configurable: true });
    track.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(host.querySelector('p')?.textContent).toBe('1');
  });

  it('scrolls a chosen slide into view', async () => {
    const { fixture, host, track } = await render();
    const scrollTo = vi.fn();
    track.scrollTo = scrollTo;

    host.querySelector('button')!.click();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenCalledWith({ left: 2 * SLIDE_WIDTH });
  });
});
