import { Component, inject, signal } from '@angular/core';
import type { Product } from '../../shop/catalog';
import type { ShopOrder } from '../../shop/checkout';
import { ShopClient } from '../../shop/shop-client';
import { StaffOrders } from '../staff/staff-orders';

@Component({
  selector: 'app-desk',
  imports: [StaffOrders],
  templateUrl: './desk.html',
})
export class Desk {
  private readonly shop = inject(ShopClient);
  protected readonly orders = signal<readonly ShopOrder[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly stockDraft = signal<Record<string, number>>({});
  protected readonly errorMessage = signal('');

  constructor() {
    void this.load();
  }

  protected replaceOrder(order: ShopOrder): void {
    this.orders.update((orders) => orders.map((item) => (item.reference === order.reference ? order : item)));
  }

  protected draftStock(variantId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.stockDraft.update((draft) => ({ ...draft, [variantId]: value }));
  }

  protected async saveStock(variantId: string): Promise<void> {
    try {
      const product = await this.shop.setStock(variantId, this.stockDraft()[variantId] ?? 0);
      this.products.update((products) => products.map((item) => (item.id === product.id ? product : item)));
      this.errorMessage.set('');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Stock could not be saved.');
    }
  }

  private async load(): Promise<void> {
    try {
      const [orders, products] = await Promise.all([this.shop.listOrders(), this.shop.loadCatalog()]);
      this.orders.set(orders);
      this.products.set(products);
      this.stockDraft.set(stockMap(products));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'The desk could not load.');
    }
  }
}

function stockMap(products: readonly Product[]): Record<string, number> {
  return Object.fromEntries(products.flatMap((product) => product.variants.map((variant) => [variant.id, variant.stock])));
}
