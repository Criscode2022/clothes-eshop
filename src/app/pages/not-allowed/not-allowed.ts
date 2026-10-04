import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopSession } from '../../shop/shop-session';

@Component({
  selector: 'app-not-allowed',
  imports: [RouterLink],
  template: `
    <section class="closed page" aria-labelledby="closed-title">
      <h1 id="closed-title" class="closed__title">This part of the shop is closed to you</h1>
      <p class="closed__text">
        The desk and the backoffice are for the people who run the shop. A client account stays on
        the floor.
      </p>
      <div class="closed__actions">
        <a class="button button--primary" routerLink="/">Return to the shop</a>
        @if (!session.current()) {
          <a class="button" routerLink="/sign-in">Sign in as staff</a>
        }
      </div>
    </section>
  `,
  styles: `
    .closed {
      display: grid;
      gap: 1.25rem;
      justify-items: start;
      padding-block: 4rem 0;
    }

    .closed__title {
      max-width: 20ch;
      font-size: var(--text-xl);
    }

    .closed__text {
      max-width: var(--measure);
      color: var(--color-text-muted);
    }

    .closed__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `,
})
export class NotAllowed {
  protected readonly session = inject(ShopSession);
}
