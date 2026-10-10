import { nextHeaderScroll } from './header-tuck';

describe('nextHeaderScroll', () => {
  it('stays in view near the top of the page', () => {
    expect(nextHeaderScroll({ baselineY: 40, tucked: false }, 120)).toEqual({
      baselineY: 120,
      tucked: false,
    });
  });

  it('tucks away once the shopper scrolls down into the page', () => {
    expect(nextHeaderScroll({ baselineY: 400, tucked: false }, 460).tucked).toBe(true);
  });

  it('comes back as soon as the shopper scrolls up', () => {
    expect(nextHeaderScroll({ baselineY: 900, tucked: true }, 880).tucked).toBe(false);
  });

  it('adds up slow scrolling instead of reading it as a resting hand', () => {
    let scroll = { baselineY: 900, tucked: false };
    for (const y of [902, 904, 906, 908]) {
      scroll = nextHeaderScroll(scroll, y);
    }

    expect(scroll).toEqual({ baselineY: 906, tucked: true });
  });

  it('ignores the jitter of a resting finger or trackpad', () => {
    const resting = { baselineY: 900, tucked: true };

    expect(nextHeaderScroll(resting, 902)).toBe(resting);
    expect(nextHeaderScroll(resting, 897)).toBe(resting);
  });
});
