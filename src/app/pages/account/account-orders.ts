import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { paymentLabel } from '../../shop/checkout';
import type { ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { newestOrdersFirst } from '../../shop/order-queue';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';

@Component({
  selector: 'app-account-orders',
  imports: [FulfillmentBadge, MoneyPipe, RouterLink],
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

    .lede {
      font-size: var(--text-ui);
      color: var(--color-text-muted);
    }

    .orders {
      display: grid;
      max-width: 52rem;
      margin: 0;
      padding: 0;
      list-style: none;
      border-top: 1px solid var(--color-text);
    }

    .order {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.5rem 1.5rem;
      align-items: center;
      padding-block: 1.25rem;
      font-size: var(--text-ui);
      border-bottom: 1px solid var(--color-border);

      @media (min-width: 48rem) {
        grid-template-columns: 9rem minmax(0, 1fr) 8rem auto;
      }
    }

    .order__reference {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .order__meta {
      color: var(--color-text-muted);
    }

    .order__total {
      font-variant-numeric: tabular-nums;
    }

    .state {
      display: grid;
      gap: 1.25rem;
      justify-items: start;
    }
  `,
})
export class AccountOrders {
  private readonly shop = inject(ShopClient);
  protected readonly session = inject(ShopSession);
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
