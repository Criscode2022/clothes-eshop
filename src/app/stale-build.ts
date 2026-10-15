import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';
import type { NavigationError } from '@angular/router';

/** How browsers word a page script that could not be downloaded: Chrome and Edge, Firefox, Safari. */
const MISSING_SCRIPT =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/;

/** When this tab last loaded each page in full for this reason. */
const RELOAD_KEY = 'marlow.staleBuildReload';

/** The same failure this soon after a full load for the same page is a real outage, not an old tab. */
const RELOAD_AGAIN_AFTER_MS = 10_000;

/** Leaves the app for a full page load of `url`. Tests replace it. */
export const FULL_PAGE_LOAD = new InjectionToken<(url: string) => void>('FULL_PAGE_LOAD', {
  factory: () => {
    const document = inject(DOCUMENT);
    return (url) => document.location.assign(url);
  },
});

export function isStaleBuildError(error: unknown): boolean {
  return error instanceof Error && MISSING_SCRIPT.test(error.message);
}

/**
 * The router's navigation error handler. A tab opened before a deploy still runs the old build, and each
 * page's script is downloaded on the way to it, under a name the new build replaced, so the page change
 * fails. Loading the address in full brings the new build. Once per page, so a script that is really
 * missing shows its error instead of reloading for ever.
 */
export function reloadStaleBuild(event: NavigationError): void {
  if (!isStaleBuildError(event.error)) {
    return;
  }
  const storage = sessionStorageOf(inject(DOCUMENT));
  const key = `${RELOAD_KEY}:${event.url}`;
  if (!storage || Date.now() - Number(storage.getItem(key)) < RELOAD_AGAIN_AFTER_MS) {
    return;
  }
  storage.setItem(key, String(Date.now()));
  inject(FULL_PAGE_LOAD)(event.url);
}

/** Storage can be missing (the server) or blocked; then the page shows the error rather than risk a loop. */
function sessionStorageOf(document: Document): Storage | null {
  try {
    return document.defaultView?.sessionStorage ?? null;
  } catch {
    return null;
  }
}
