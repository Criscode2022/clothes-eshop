import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { canCancelOrder } from '../../shop/access';
import { canBeCancelled, paymentLabel } from '../../shop/checkout';
import type { ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
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
  private readonly session = inject(ShopSession);
  private readonly injector = inject(Injector);
  private readonly askCancel = viewChild<ElementRef<HTMLButtonElement>>('askCancel');
  private readonly confirmCancel = viewChild<ElementRef<HTMLButtonElement>>('confirmCancel');
  private readonly cancelledNote = viewChild<ElementRef<HTMLElement>>('cancelledNote');

  /** True on the page checkout lands on, so it can thank the shopper; a revisit reads as a plain record. */
  protected readonly justPlaced =
    inject(Router).currentNavigation()?.extras.state?.['placed'] === true;
  protected readonly paymentLabel = paymentLabel;
  protected readonly copied = signal(false);
  protected readonly confirmingCancel = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly cancelError = signal('');
  protected readonly cancelledNow = signal(false);
  protected readonly order = resource({
    params: () => this.reference(),
    loader: ({ params }) => this.shop.order(params),
  });

  /** The client who placed it, or staff, until it is completed. */
  protected canCancel(order: ShopOrder): boolean {
    return canBeCancelled(order.fulfillment) && canCancelOrder(this.session.current(), order);
  }

  /** A guest order has no account to cancel it from, so the shop does it by reference. */
  protected guestMayAskToCancel(order: ShopOrder): boolean {
    return canBeCancelled(order.fulfillment) && order.clientId === null;
  }

  protected askToCancel(): void {
    this.confirmingCancel.set(true);
    this.focusAfterRender(this.confirmCancel);
  }

  protected keepOrder(): void {
    this.confirmingCancel.set(false);
    this.cancelError.set('');
    this.focusAfterRender(this.askCancel);
  }

  protected async cancel(order: ShopOrder): Promise<void> {
    this.cancelling.set(true);
    try {
      this.order.set(await this.shop.cancelOrder(order.reference));
      this.confirmingCancel.set(false);
      this.cancelError.set('');
      this.cancelledNow.set(true);
      this.focusAfterRender(this.cancelledNote);
    } catch (error) {
      this.cancelError.set(
        error instanceof Error ? error.message : `${order.reference} could not be cancelled.`,
      );
    } finally {
      this.cancelling.set(false);
    }
  }

  protected async copyReference(reference: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(reference);
      this.copied.set(true);
    } catch {
      // Clipboard refused: the reference stays on screen to copy by hand.
      this.copied.set(false);
    }
  }

  /** The control that was pressed is gone after the change, so focus moves to what replaced it. */
  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender({ write: () => target()?.nativeElement.focus() }, { injector: this.injector });
  }
}
