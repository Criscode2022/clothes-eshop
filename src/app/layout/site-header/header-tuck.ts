/** Above this, the header always shows: the shopper is still at the top of the page. */
const TUCK_AFTER_PX = 240;
/** Smaller movements are a resting hand, not a change of direction. */
const JITTER_PX = 6;

export interface HeaderScroll {
  /** Where the last real change of direction was measured from. */
  readonly baselineY: number;
  readonly tucked: boolean;
}

/** The header leaves while the shopper reads down the page and returns the moment they scroll back up. */
export function nextHeaderScroll(current: HeaderScroll, y: number): HeaderScroll {
  if (y < TUCK_AFTER_PX) {
    return { baselineY: y, tucked: false };
  }
  const moved = y - current.baselineY;
  if (Math.abs(moved) < JITTER_PX) {
    return current;
  }
  return { baselineY: y, tucked: moved > 0 };
}
