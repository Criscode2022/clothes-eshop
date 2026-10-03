import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bag } from '../../shop/bag';
import { CatalogStore } from '../../shop/catalog-store';
import { quoteOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { centsUntilFreeShipping } from '../../shop/money';

@Component({
  selector: 'app-bag',
  imports: [RouterLink, MoneyPipe],
  templateUrl: './bag.html',
})
export class BagPage {
  private readonly bag = inject(Bag);
  private readonly catalog = inject(CatalogStore);

  protected readonly lines = this.bag.detailed;
  protected readonly centsUntilFreeShipping = centsUntilFreeShipping;
  protected readonly quote = computed(() => {
    const lines = this.bag.items();
    if (lines.length === 0) {
      return null;
    }
    try {
      return quoteOrder(lines, this.catalog.pieces());
    } catch {
      return null;
    }
  });

  protected increase(variantId: string, quantity: number, stock: number): void {
    if (quantity < stock) {
      this.bag.setQuantity(variantId, quantity + 1);
    }
  }

  protected decrease(variantId: string, quantity: number): void {
    this.bag.setQuantity(variantId, quantity - 1);
  }
}
