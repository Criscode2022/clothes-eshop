import { Component, inject, signal } from '@angular/core';
import { FormField, form, min, minLength, required, submit } from '@angular/forms/signals';
import { CATEGORIES } from '../../shop/catalog';
import type { Product } from '../../shop/catalog';
import type { ShopOrder } from '../../shop/checkout';
import { ShopClient } from '../../shop/shop-client';
import { MoneyPipe } from '../../shop/money.pipe';
import { StaffOrders } from '../staff/staff-orders';

@Component({
  selector: 'app-owner',
  imports: [FormField, MoneyPipe, StaffOrders],
  templateUrl: './owner.html',
})
export class Owner {
  private readonly shop = inject(ShopClient);
  protected readonly categories = CATEGORIES;
  protected readonly orders = signal<readonly ShopOrder[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly chosenId = signal('');
  protected readonly priceModel = signal({ priceCents: 0 });
  protected readonly variantModel = signal({ size: '', color: '', stock: 0 });
  protected readonly pieceModel = signal({
    name: '',
    category: 'outerwear',
    priceCents: 0,
    summary: '',
    size: '',
    color: '',
    stock: 0,
  });
  protected readonly priceForm = form(this.priceModel, (path) => {
    required(path.priceCents, { message: 'Enter a price in cents.' });
    min(path.priceCents, 1, { message: 'Enter a price in cents.' });
  });
  protected readonly variantForm = form(this.variantModel, (path) => {
    required(path.size, { message: 'Enter a size.' });
    minLength(path.size, 1, { message: 'Enter a size.' });
    required(path.color, { message: 'Enter a color.' });
    minLength(path.color, 1, { message: 'Enter a color.' });
    min(path.stock, 0, { message: 'Stock must be a whole number.' });
  });
  protected readonly pieceForm = form(this.pieceModel, (path) => {
    required(path.name, { message: 'Enter a name for the piece.' });
    minLength(path.name, 2, { message: 'Enter a name for the piece.' });
    required(path.category);
    min(path.priceCents, 1, { message: 'Enter a price in cents.' });
    required(path.summary, { message: 'Enter a short description.' });
    required(path.size, { message: 'Enter a size.' });
    required(path.color, { message: 'Enter a color.' });
    min(path.stock, 0, { message: 'Stock must be a whole number.' });
  });

  constructor() {
    void this.load();
  }

  protected replaceOrder(order: ShopOrder): void {
    this.orders.update((orders) => orders.map((item) => (item.reference === order.reference ? order : item)));
  }

  protected chooseProduct(event: Event): void {
    const productId = (event.target as HTMLSelectElement).value;
    this.chosenId.set(productId);
    const product = this.products().find((item) => item.id === productId);
    if (product) {
      this.priceModel.set({ priceCents: product.priceCents });
    }
  }

  protected savePrice(): void {
    submit(this.priceForm, async () => {
      const productId = this.chosenId();
      if (!productId) {
        this.errorMessage.set('Choose a piece first.');
        return;
      }
      try {
        const product = await this.shop.setPrice(productId, this.priceModel().priceCents);
        this.replaceProduct(product);
        this.errorMessage.set('');
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'The price could not be saved.');
      }
    });
  }

  protected addVariant(): void {
    submit(this.variantForm, async () => {
      const productId = this.chosenId();
      if (!productId) {
        this.errorMessage.set('Choose a piece first.');
        return;
      }
      const draft = this.variantModel();
      try {
        const product = await this.shop.addVariant(productId, draft.size, draft.color, draft.stock);
        this.replaceProduct(product);
        this.variantModel.set({ size: '', color: '', stock: 0 });
        this.errorMessage.set('');
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'The size could not be added.');
      }
    });
  }

  protected createPiece(): void {
    submit(this.pieceForm, async () => {
      try {
        const product = await this.shop.createProduct(this.pieceModel());
        this.products.update((products) => [...products, product]);
        this.chosenId.set(product.id);
        this.priceModel.set({ priceCents: product.priceCents });
        this.errorMessage.set('');
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'The piece could not be added.');
      }
    });
  }

  private replaceProduct(product: Product): void {
    this.products.update((products) => products.map((item) => (item.id === product.id ? product : item)));
  }

  private async load(): Promise<void> {
    try {
      const [orders, products] = await Promise.all([this.shop.listOrders(), this.shop.loadCatalog()]);
      this.orders.set(orders);
      this.products.set(products);
      const first = products[0];
      if (first) {
        this.chosenId.set(first.id);
        this.priceModel.set({ priceCents: first.priceCents });
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'The backoffice could not load.');
    }
  }
}
