import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideShoppingBag, lucideX } from '@ng-icons/lucide';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { filter } from 'rxjs';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { CATEGORIES } from '../../shop/catalog';
import { BagLines } from '../../ui/bag-lines/bag-lines';
import { FreeShipping } from '../../ui/free-shipping';
import { OrderTotals } from '../../ui/order-totals';
import { ShopButtonImports } from '../../ui/shop-button';

/** The bag sliding in from the right edge, over whatever page the shopper is on. */
@Component({
  selector: 'app-bag-panel',
  imports: [
    BagLines,
    FreeShipping,
    TranslatePipe,
    HlmEmptyImports,
    HlmSheetImports,
    NgIcon,
    OrderTotals,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideCheck, lucideShoppingBag, lucideX })],
  templateUrl: './bag-panel.html',
  styleUrl: './bag-panel.scss',
})
export class BagPanel {
  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly categories = CATEGORIES;
  protected readonly addedLine = computed(
    () => this.bag.detailed().find((line) => line.variantId === this.drawer.justAdded()) ?? null,
  );

  constructor() {
    // Moving to another page closes the bag; the shell then puts focus on the new page.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.drawer.close());
  }

  /** Escape, the scrim, and the close button all end here, so the drawer's state never drifts from the sheet's. */
  protected stateChanged(state: BrnDialogState): void {
    if (state === 'closed') {
      this.drawer.close();
    }
  }
}
