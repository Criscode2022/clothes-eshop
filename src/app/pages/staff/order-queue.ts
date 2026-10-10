import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideCircleAlert, lucideInbox, lucideSearch } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { fulfillmentActions, fulfillmentName, paymentLabel } from '../../shop/checkout';
import type { Fulfillment, ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { QUEUE_VIEWS, ordersInView, queueCounts } from '../../shop/order-queue';
import type { QueueView } from '../../shop/order-queue';
import { ShopClient } from '../../shop/shop-client';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';
import { ShopButtonImports } from '../../ui/shop-button';

/** Every order the signed-in staff member may see, filtered by state, with each order's next step one click away. */
@Component({
  selector: 'app-order-queue',
  imports: [
    FulfillmentBadge,
    HlmAlertImports,
    HlmEmptyImports,
    HlmInputGroupImports,
    HlmSkeleton,
    HlmSpinner,
    HlmTableImports,
    MoneyPipe,
    NgIcon,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideCircleAlert, lucideInbox, lucideSearch })],
  templateUrl: './order-queue.html',
  styleUrl: './order-queue.scss',
})
export class OrderQueue {
  /** Set from the route: the desk says "Orders", the backoffice "Every order". */
  readonly heading = input('Orders');

  private readonly shop = inject(ShopClient);
  private readonly orders = signal<readonly ShopOrder[]>([]);

  protected readonly paymentLabel = paymentLabel;
  protected readonly views = QUEUE_VIEWS;
  protected readonly view = signal<QueueView>('open');
  protected readonly query = signal('');
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly actionError = signal('');
  protected readonly lastChange = signal('');
  protected readonly moving = signal<string | null>(null);
  protected readonly openReference = signal<string | null>(null);
  protected readonly confirmingCancel = signal<string | null>(null);
  protected readonly counts = computed(() => queueCounts(this.orders()));
  protected readonly visible = computed(() =>
    ordersInView(this.orders(), this.view(), this.query()),
  );
  protected readonly hasOrders = computed(() => this.orders().length > 0);

  constructor() {
    void this.load();
  }

  protected chooseView(view: QueueView): void {
    this.view.set(view);
    this.confirmingCancel.set(null);
  }

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected toggleDetails(reference: string): void {
    this.openReference.update((open) => (open === reference ? null : reference));
  }

  protected nextStep(order: ShopOrder): { target: Fulfillment; label: string } | null {
    return (
      fulfillmentActions(order.fulfillment).find((action) => action.target !== 'cancelled') ?? null
    );
  }

  protected canCancel(order: ShopOrder): boolean {
    return fulfillmentActions(order.fulfillment).some((action) => action.target === 'cancelled');
  }

  protected pieceCount(order: ShopOrder): number {
    return order.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  protected async move(order: ShopOrder, target: Fulfillment): Promise<void> {
    this.moving.set(order.reference);
    this.confirmingCancel.set(null);
    try {
      const updated = await this.shop.moveFulfillment(order.reference, target);
      this.orders.update((orders) =>
        orders.map((item) => (item.reference === updated.reference ? updated : item)),
      );
      this.lastChange.set(
        `${updated.reference} is now ${fulfillmentName(updated.fulfillment).toLowerCase()}.`,
      );
      this.actionError.set('');
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : `${order.reference} could not be moved.`,
      );
    } finally {
      this.moving.set(null);
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.orders.set(await this.shop.listOrders());
      this.loadError.set('');
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'The orders could not load.');
    } finally {
      this.loading.set(false);
    }
  }
}
