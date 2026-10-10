import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingBag } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { Bag } from '../../shop/bag';
import { CatalogStore } from '../../shop/catalog-store';
import { piecesToPairWith } from '../../shop/cloth';
import { BagLines } from '../../ui/bag-lines/bag-lines';
import { FreeShipping } from '../../ui/free-shipping';
import { OrderTotals } from '../../ui/order-totals';
import { ProductCard } from '../../ui/product-card/product-card';
import { Reveal } from '../../ui/reveal';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-bag',
  imports: [
    BagLines,
    FreeShipping,
    HlmCardImports,
    HlmEmptyImports,
    NgIcon,
    OrderTotals,
    ProductCard,
    Reveal,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideShoppingBag })],
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

    .title__count {
      margin-inline-start: 0.375rem;
      font-size: var(--text-md);
      font-weight: 400;
      letter-spacing: 0;
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
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
      gap: 1.5rem;

      @media (min-width: 64rem) {
        position: sticky;
        top: calc(var(--header-height) + 2rem);
      }
    }

    .summary__body {
      display: grid;
      gap: 1.5rem;
    }

    .summary__note,
    .summary__problem {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    .summary__problem {
      color: var(--color-danger);
    }

    .pairs {
      display: grid;
      gap: 1.5rem;
      margin-top: 4rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--color-border);
    }

    .pairs__title {
      font-size: var(--text-md);
      letter-spacing: 0;
    }

    .pairs__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2.5rem 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;

      @media (min-width: 48rem) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
      }
    }
  `,
})
export class BagPage {
  private readonly catalog = inject(CatalogStore);
  protected readonly bag = inject(Bag);
  /** The floor around what is already in the bag, without repeating it. */
  protected readonly pairs = computed(() =>
    piecesToPairWith(
      this.catalog.pieces(),
      this.bag.items().map((line) => line.productId),
    ),
  );
}
