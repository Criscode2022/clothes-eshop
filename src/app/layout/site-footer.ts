import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../shop/catalog';
import { ShopSession } from '../shop/shop-session';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="page footer__top">
        <div class="footer__brand">
          <a class="wordmark" routerLink="/">Marlow</a>
          <p>A small ready-to-wear floor. Prices in US dollars.</p>
        </div>
        <nav class="footer__nav" aria-label="Footer">
          <div>
            <h2 class="footer__heading">Shop</h2>
            <ul role="list">
              <li><a class="sweep" routerLink="/">Shop all</a></li>
              @for (category of categories; track category.slug) {
                <li>
                  <a class="sweep" [routerLink]="['/category', category.slug]">{{
                    category.name
                  }}</a>
                </li>
              }
            </ul>
          </div>
          <div>
            <h2 class="footer__heading">Help</h2>
            <ul role="list">
              <li><a class="sweep" routerLink="/atelier">Atelier</a></li>
              <li>
                <a class="sweep" routerLink="/atelier" fragment="shipping">Shipping and payment</a>
              </li>
              <li>
                <a class="sweep" routerLink="/atelier" fragment="orders">How an order leaves</a>
              </li>
            </ul>
          </div>
          <div>
            <h2 class="footer__heading">Account</h2>
            <ul role="list">
              @if (session.current()?.role === 'client') {
                <li><a class="sweep" routerLink="/account/orders">Your orders</a></li>
              } @else if (!session.current()) {
                <li><a class="sweep" routerLink="/sign-in">Sign in</a></li>
              }
              <li><a class="sweep" routerLink="/bag">Bag</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="page footer__base">
        <p>
          Shipping is $8.00, and free when the pieces total $200.00. Marlow never asks for a card
          number.
        </p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      margin-top: 7rem;
      font-size: var(--text-sm);
      border-top: 1px solid var(--color-border);
    }

    .footer__top {
      display: grid;
      gap: 2.5rem;
      padding-block: 3rem;

      @media (min-width: 48rem) {
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      }
    }

    .footer__brand {
      display: grid;
      gap: 0.75rem;
      align-content: start;
      color: var(--color-text-muted);

      .wordmark {
        justify-self: start;
        color: var(--color-text);
      }
    }

    .footer__nav {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      gap: 2rem;

      ul {
        display: grid;
        gap: 0.25rem;
        margin: 0.75rem 0 0;
        padding: 0;
        list-style: none;
      }

      a {
        display: inline-block;
        padding-block: 0.25rem;
      }
    }

    .footer__heading {
      font-size: var(--text-sm);
      font-weight: 500;
      letter-spacing: 0;
      color: var(--color-text-muted);
    }

    .footer__base {
      padding-block: 1.5rem 2rem;
      color: var(--color-text-muted);
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class SiteFooter {
  protected readonly categories = CATEGORIES;
  protected readonly session = inject(ShopSession);
}
