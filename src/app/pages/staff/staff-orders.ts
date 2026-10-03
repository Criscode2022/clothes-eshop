import { Component, inject, input, output, signal } from '@angular/core';
import { fulfillmentActions, paymentLabel } from '../../shop/checkout';
import type { Fulfillment, ShopOrder } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';

@Component({
  selector: 'app-staff-orders',
  imports: [MoneyPipe],
  templateUrl: './staff-orders.html',
})
export class StaffOrders {
  readonly orders = input.required<readonly ShopOrder[]>();
  readonly changed = output<ShopOrder>();
  private readonly shop = inject(ShopClient);
  protected readonly errorMessage = signal('');
  protected readonly paymentLabel = paymentLabel;
  protected readonly actions = fulfillmentActions;

  protected async move(reference: string, fulfillment: Fulfillment): Promise<void> {
    try {
      this.changed.emit(await this.shop.moveFulfillment(reference, fulfillment));
      this.errorMessage.set('');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'The order could not be moved.');
    }
  }
}
