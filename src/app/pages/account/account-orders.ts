import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideCircleAlert, lucideReceipt } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { paymentLabel } from '../../shop/checkout';
import type { ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { newestOrdersFirst } from '../../shop/order-queue';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';
import { Reveal } from '../../ui/reveal';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-account-orders',
  imports: [
    FulfillmentBadge,
    HlmAlertImports,
    HlmBreadcrumbImports,
    HlmEmptyImports,
    HlmItemImports,
    HlmSkeleton,
    MoneyPipe,
    NgIcon,
    Reveal,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideCircleAlert, lucideReceipt })],
  templateUrl: './account-orders.html',
  styles: `
    .account {
      display: grid;
      gap: 2rem;
      padding-block: 2.5rem 0;
    }

    .head {
      display: grid;
      gap: 0.5rem;
    }

    .title {
      font-size: var(--text-xl);
    }

    .orders {
      display: grid;
      gap: 0.5rem;
      max-width: 52rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .order {
      min-height: 4.5rem;
      padding-inline: 1.25rem;
      text-decoration: none;
      transition:
        border-color var(--duration-fast) ease-out,
        background-color var(--duration-fast) ease-out;

      &:hover {
        border-color: var(--color-text);

        .order__go {
          translate: 0.25rem 0;
        }
      }
    }

    .order__reference {
      font-variant-numeric: tabular-nums;
    }

    .order__end {
      gap: 1.25rem;
    }

    .order__total {
      font-variant-numeric: tabular-nums;
    }

    .order__go {
      font-size: 1.125rem;
      color: var(--color-text-muted);
      transition: translate var(--duration-base) var(--ease-out);
    }

    .order-skeleton {
      height: 4.5rem;
    }

    .state {
      display: grid;
      gap: 1.25rem;
      justify-items: start;
      max-width: 36rem;
    }

    .empty {
      max-width: 52rem;
      border: 1px solid var(--color-border);
    }
  `,
})
export class AccountOrders {
  private readonly shop = inject(ShopClient);
  private readonly session = inject(ShopSession);
  protected readonly orders = resource({
    params: () => this.session.current()?.id,
    loader: () => this.shop.listOrders(),
  });
  protected readonly newestFirst = computed(() => newestOrdersFirst(this.orders.value() ?? []));

  protected summary(order: ShopOrder): string {
    const pieces = order.lines.reduce((sum, line) => sum + line.quantity, 0);
    return `${pieces} ${pieces === 1 ? 'piece' : 'pieces'}, ${paymentLabel(order.paymentMethod).toLowerCase()}`;
  }
}
