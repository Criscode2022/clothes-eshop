import { Service, computed, inject, signal } from '@angular/core';
import { findProduct } from './catalog';
import { StockLimitError, addLine, changeQuantity } from './cart';
import type { CartLine } from './cart';
import { CatalogStore } from './catalog-store';

export interface BagLine extends CartLine {
  readonly name: string;
  readonly size: string;
  readonly color: string;
  readonly unitPriceCents: number;
  readonly lineCents: number;
  readonly stock: number;
}

@Service()
export class Bag {
  private readonly catalog = inject(CatalogStore);
  private readonly lines = signal<readonly CartLine[]>([]);
  private readonly notice = signal('');

  readonly items = this.lines.asReadonly();
  readonly noticeMessage = this.notice.asReadonly();
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly detailed = computed(() => this.describe(this.lines()));

  add(productId: string, variantId: string): void {
    const variant = this.variant(productId, variantId);
    if (!variant) {
      this.notice.set('That size is no longer on the floor.');
      return;
    }
    try {
      this.lines.update((lines) => addLine(lines, productId, variantId, 1, variant.stock));
      this.notice.set(`Added ${variant.name}, ${variant.color} ${variant.size}.`);
    } catch (error) {
      this.notice.set(error instanceof StockLimitError ? error.message : 'That piece could not be added.');
    }
  }

  setQuantity(variantId: string, quantity: number): void {
    const line = this.detailed().find((item) => item.variantId === variantId);
    if (!line) {
      return;
    }
    try {
      this.lines.update((lines) => changeQuantity(lines, variantId, quantity, line.stock));
      this.notice.set('');
    } catch (error) {
      this.notice.set(error instanceof StockLimitError ? error.message : 'That quantity is not available.');
    }
  }

  clearNotice(): void {
    this.notice.set('');
  }

  clear(): void {
    this.lines.set([]);
  }

  private variant(productId: string, variantId: string): (BagLine & { stock: number }) | null {
    return this.describe([{ productId, variantId, quantity: 1 }])[0] ?? null;
  }

  private describe(lines: readonly CartLine[]): BagLine[] {
    const products = this.catalog.pieces();
    return lines.flatMap((line) => {
      const product = findProduct(products, line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      if (!product || !variant) {
        return [];
      }
      return [
        {
          ...line,
          name: product.name,
          size: variant.size,
          color: variant.color,
          unitPriceCents: product.priceCents,
          lineCents: product.priceCents * line.quantity,
          stock: variant.stock,
        },
      ];
    });
  }
}
