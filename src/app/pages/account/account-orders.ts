import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { paymentLabel } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';

@Component({
  selector: 'app-account-orders',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './account-orders.html',
})
export class AccountOrders {
  private readonly shop = inject(ShopClient);
  protected readonly paymentLabel = paymentLabel;
  protected readonly orders = resource({
    params: () => true,
    loader: () => this.shop.listOrders(),
  });
}
