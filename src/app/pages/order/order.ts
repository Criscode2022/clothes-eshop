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
import { lucideCheck, lucideCircleAlert, lucideCopy } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialog, HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { canCancelOrder } from '../../shop/access';
import { paymentStateOf, paymentSummary } from '../../shop/bank-transfer';
import { canBeCancelled } from '../../shop/checkout';
import type { ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { FulfillmentBadge } from '../../ui/fulfillment-badge';
import { OrderTotals } from '../../ui/order-totals';
import { OrderTrack } from '../../ui/order-track';
import { PaymentBadge } from '../../ui/payment-badge';
import { PiecePhoto } from '../../ui/piece-photo';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-order',
  imports: [
    FulfillmentBadge,
    HlmAlertDialogImports,
    HlmAlertImports,
    HlmCardImports,
    HlmEmptyImports,
    HlmSkeleton,
    HlmSpinner,
    MoneyPipe,
    NgIcon,
    OrderTotals,
    OrderTrack,
    PaymentBadge,
    PiecePhoto,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideCheck, lucideCircleAlert, lucideCopy })],
  templateUrl: './order.html',
  styleUrl: './order.scss',
})
export class OrderPage {
  readonly reference = input.required<string>();
  private readonly shop = inject(ShopClient);
  private readonly session = inject(ShopSession);
  private readonly injector = inject(Injector);
  private readonly cancelDialog = viewChild(HlmAlertDialog);
  private readonly cancelledNote = viewChild<ElementRef<HTMLElement>>('cancelledNote');

  /** True on the page checkout lands on, so it can thank the shopper; a revisit reads as a plain record. */
  protected readonly justPlaced =
    inject(Router).currentNavigation()?.extras.state?.['placed'] === true;
  protected readonly paymentStateOf = paymentStateOf;
  protected readonly paymentSummary = paymentSummary;
  protected readonly copied = signal(false);
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

  /** A guest order has no account to cancel it from, so the guest asks the shop by reference. */
  protected guestMayAskToCancel(order: ShopOrder): boolean {
    return canBeCancelled(order.fulfillment) && order.clientId === null && !this.canCancel(order);
  }

  protected forgetCancelError(): void {
    this.cancelError.set('');
  }

  protected async cancel(order: ShopOrder): Promise<void> {
    this.cancelling.set(true);
    try {
      this.order.set(await this.shop.cancelOrder(order.reference));
      this.cancelDialog()?.close();
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

  /** The button that opened the dialog is gone once the order is cancelled, so focus moves to the outcome. */
  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender({ write: () => target()?.nativeElement.focus() }, { injector: this.injector });
  }
}
