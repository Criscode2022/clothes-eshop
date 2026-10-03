import { Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { paymentLabel } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';

@Component({
  selector: 'app-order',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './order.html',
})
export class OrderPage {
  readonly reference = input.required<string>();
  private readonly shop = inject(ShopClient);
  protected readonly paymentLabel = paymentLabel;
  protected readonly order = resource({
    params: () => this.reference(),
    loader: ({ params }) => this.shop.order(params),
  });
}
