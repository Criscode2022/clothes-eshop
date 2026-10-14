/** Whether the shopper asked the system for less motion. False on the server, which cannot know. */
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
