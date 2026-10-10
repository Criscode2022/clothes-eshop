import { Component, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { paymentLabel } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';
import { OrderTotals } from '../../ui/order-totals';
import { OrderTrack } from '../../ui/order-track';
import { PiecePhoto } from '../../ui/piece-photo';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-order',
  imports: [
    FulfillmentBadge,
    HlmCardImports,
    HlmEmptyImports,
    HlmSkeleton,
    MoneyPipe,
    NgIcon,
    OrderTotals,
    OrderTrack,
    PiecePhoto,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideCheck, lucideCopy })],
  templateUrl: './order.html',
  styleUrl: './order.scss',
})
export class OrderPage {
  readonly reference = input.required<string>();
  private readonly shop = inject(ShopClient);

  /** True on the page checkout lands on, so it can thank the shopper; a revisit reads as a plain record. */
  protected readonly justPlaced =
    inject(Router).currentNavigation()?.extras.state?.['placed'] === true;
  protected readonly paymentLabel = paymentLabel;
  protected readonly copied = signal(false);
  protected readonly order = resource({
    params: () => this.reference(),
    loader: ({ params }) => this.shop.order(params),
  });

  protected async copyReference(reference: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(reference);
      this.copied.set(true);
    } catch {
      // Clipboard refused: the reference stays on screen to copy by hand.
      this.copied.set(false);
    }
  }
}
