import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bag } from '../../shop/bag';
import { BagLines } from '../../ui/bag-lines/bag-lines';
import { FreeShipping } from '../../ui/free-shipping';
import { OrderTotals } from '../../ui/order-totals';

@Component({
  selector: 'app-bag',
  imports: [BagLines, FreeShipping, OrderTotals, RouterLink],
  templateUrl: './bag.html',
  styles: `
    .bag {
      display: grid;
      gap: 2rem;
      padding-block: 2.5rem 0;
    }

    .title {
      font-size: var(--text-xl);
    }

    .layout {
      display: grid;
      gap: 3rem;

      @media (min-width: 64rem) {
        grid-template-columns: minmax(0, 1fr) minmax(20rem, 24rem);
        gap: 5rem;
        align-items: start;
      }
    }

    .summary {
      display: grid;
      gap: 1.5rem;
      padding: 1.75rem;
      background: var(--color-surface);

      @media (min-width: 64rem) {
        position: sticky;
        top: calc(var(--header-height) + 2rem);
      }
    }

    .summary__title {
      font-size: var(--text-md);
      letter-spacing: 0;
    }

    .summary__note {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    .empty {
      display: grid;
      gap: 1.25rem;
      justify-items: start;
    }
  `,
})
export class BagPage {
  protected readonly bag = inject(Bag);
}
