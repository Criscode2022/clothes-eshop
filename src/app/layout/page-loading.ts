import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import type { Event as RouterEvent } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';

/** How long a page change runs before it shows as loading, so quick ones never flash. */
export const LOADING_DELAY_MS = 150;

/** Whether a router event starts a page change (true), ends one (false), or says nothing about it (null). */
export function pageChangeUnderWay(event: RouterEvent): boolean | null {
  if (event instanceof NavigationStart) {
    return true;
  }
  const ended =
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError ||
    event instanceof NavigationSkipped;
  return ended ? false : null;
}

/**
 * While a page change is slow to arrive, the page dims behind a spinner so the shopper knows it is on its way.
 * The spinner is Spartan's loader icon drawn directly: Helm's spinner would bring tailwind-merge into the first page.
 */
@Component({
  selector: 'app-page-loading',
  imports: [NgIcon],
  providers: [provideIcons({ lucideLoader2 })],
  template: `
    <p class="sr-only" role="status">{{ shown() ? 'Loading the page' : '' }}</p>
    @if (shown()) {
      <div class="veil">
        <ng-icon name="lucideLoader2" class="veil__spinner" aria-hidden="true" />
      </div>
    }
  `,
  styles: `
    .veil {
      position: fixed;
      inset: 0;
      z-index: 25;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--color-canvas) 60%, transparent);
      cursor: progress;
      animation: veil-in var(--duration-base) var(--ease-out) both;
    }

    .veil__spinner {
      font-size: 2rem;
      color: var(--color-text);
      animation: spin 1s linear infinite;
    }

    @keyframes veil-in {
      from {
        opacity: 0;
      }
    }

    @keyframes spin {
      to {
        rotate: 1turn;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .veil,
      .veil__spinner {
        animation: none;
      }
    }
  `,
})
export class PageLoading {
  protected readonly shown = signal(false);
  private delay: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        const underWay = pageChangeUnderWay(event);
        if (underWay !== null) {
          this.follow(underWay);
        }
      });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.delay));
  }

  private follow(underWay: boolean): void {
    clearTimeout(this.delay);
    if (underWay) {
      this.delay = setTimeout(() => this.shown.set(true), LOADING_DELAY_MS);
    } else {
      this.shown.set(false);
    }
  }
}
