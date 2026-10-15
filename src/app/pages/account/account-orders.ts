import { Location } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  resource,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideCircleAlert,
  lucideReceipt,
  lucideSearch,
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { paymentStateOf } from '../../shop/bank-transfer';
import { paymentLabel } from '../../shop/checkout';
import type { ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ORDER_SORTS, listedOrders, orderListParams, orderListView } from '../../shop/order-list';
import type { OrderListView } from '../../shop/order-list';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { Breadcrumb } from '../../ui/breadcrumb';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';
import { PaymentBadge } from '../../ui/payment-badge';
import { Reveal } from '../../ui/reveal';
import { ShopButtonImports } from '../../ui/shop-button';

/** The browser's own date format: Angular's DatePipe would bring its formatting into the first page. */
const PLACED_ON = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

@Component({
  selector: 'app-account-orders',
  imports: [
    Breadcrumb,
    FulfillmentBadge,
    HlmAlertImports,
    HlmEmptyImports,
    HlmInputGroupImports,
    HlmItemImports,
    HlmSkeleton,
    MoneyPipe,
    NgIcon,
    PaymentBadge,
    Reveal,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideCircleAlert, lucideReceipt, lucideSearch })],
  templateUrl: './account-orders.html',
  styleUrl: './account-orders.scss',
})
export class AccountOrders {
  /** The query parameters, bound by the router: `?reference=…&sort=date|price&dir=asc|desc`. */
  readonly reference = input<string>();
  readonly sort = input<string>();
  readonly dir = input<string>();

  private readonly shop = inject(ShopClient);
  private readonly session = inject(ShopSession);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly injector = inject(Injector);
  private readonly referenceSearch = viewChild<ElementRef<HTMLInputElement>>('referenceSearch');

  protected readonly paymentStateOf = paymentStateOf;
  protected readonly sorts = ORDER_SORTS;
  protected readonly orders = resource({
    params: () => this.session.current()?.id,
    loader: () => this.shop.listOrders(),
  });
  protected readonly hasOrders = computed(() => (this.orders.value() ?? []).length > 0);
  /**
   * Seeded from the address when the page opens. A search or a sort changes it here and rewrites the
   * address in place, rather than navigating, so typing never loses focus or scrolls the page away.
   */
  protected readonly view = linkedSignal(() =>
    orderListView({ reference: this.reference(), sort: this.sort(), dir: this.dir() }),
  );
  protected readonly listed = computed(() => listedOrders(this.orders.value() ?? [], this.view()));
  protected readonly sortId = computed(() => `${this.view().sort}-${this.view().dir}`);
  protected readonly filtered = computed(
    () => Object.keys(orderListParams(this.view())).length > 0,
  );
  /** Said to screen readers as the list changes; a search shows how many of all match. */
  protected readonly count = computed(() => {
    const all = this.orders.value()?.length ?? 0;
    const noun = all === 1 ? 'order' : 'orders';
    return this.view().reference.trim()
      ? `${this.listed().length} of ${all} ${noun}`
      : `${all} ${noun}`;
  });

  protected searchFor(event: Event): void {
    this.show({ ...this.view(), reference: (event.target as HTMLInputElement).value });
  }

  protected sortBy(event: Event): void {
    const option = ORDER_SORTS.find(
      (item) => item.id === (event.target as HTMLSelectElement).value,
    );
    if (option) {
      this.show({ ...this.view(), sort: option.sort, dir: option.dir });
    }
  }

  /** Back to every order, newest first, with no query parameters; focus goes to the search. */
  protected clearFilters(): void {
    this.show(orderListView({}));
    afterNextRender(
      { write: () => this.referenceSearch()?.nativeElement.focus() },
      { injector: this.injector },
    );
  }

  private show(view: OrderListView): void {
    this.view.set(view);
    const address = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: orderListParams(view),
    });
    this.location.replaceState(this.router.serializeUrl(address));
  }

  protected placedOn(order: ShopOrder): string {
    return PLACED_ON.format(new Date(order.placedAt));
  }

  protected summary(order: ShopOrder): string {
    const pieces = order.lines.reduce((sum, line) => sum + line.quantity, 0);
    return `${pieces} ${pieces === 1 ? 'piece' : 'pieces'}, ${paymentLabel(order.paymentMethod).toLowerCase()}`;
  }
}
