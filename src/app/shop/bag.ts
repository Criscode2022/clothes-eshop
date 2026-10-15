import { Service, computed, inject, signal } from '@angular/core';
import { findProduct } from './catalog';
import { StockLimitError, addLine, changeQuantity } from './cart';
import type { CartLine } from './cart';
import { CatalogStore } from './catalog-store';
import { quoteOrder } from './checkout';
import type { DeliveryMethod, OrderQuote } from './checkout';

export interface BagLine extends CartLine {
  readonly name: string;
  readonly size: string;
  readonly color: string;
  readonly unitPriceCents: number;
  readonly lineCents: number;
  readonly stock: number;
}

export type AddOutcome =
  | { readonly added: true; readonly line: BagLine }
  | { readonly added: false; readonly reason: string };

@Service()
export class Bag {
  private readonly catalog = inject(CatalogStore);
  private readonly lines = signal<readonly CartLine[]>([]);
  private readonly notice = signal('');

  readonly items = this.lines.asReadonly();
  readonly noticeMessage = this.notice.asReadonly();
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly detailed = computed(() => this.describe(this.lines()));
  /** What the bag costs shipped, or null when it is empty or a line no longer fits the floor. */
  readonly quote = computed(() => this.quoteFor('ship'));

  /** Adds one of a size. A refusal is also left in the notice so the page can say why. */
  add(productId: string, variantId: string): AddOutcome {
    const variant = this.describe([{ productId, variantId, quantity: 1 }])[0];
    if (!variant) {
      return this.refuse('That size is no longer on the floor.');
    }
    try {
      this.lines.update((lines) => addLine(lines, productId, variantId, 1, variant.stock));
    } catch (error) {
      return this.refuse(
        error instanceof StockLimitError ? error.message : 'That piece could not be added.',
      );
    }
    this.notice.set('');
    return {
      added: true,
      line: this.detailed().find((line) => line.variantId === variantId) ?? variant,
    };
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
      this.notice.set(
        error instanceof StockLimitError ? error.message : 'That quantity is not available.',
      );
    }
  }

  remove(variantId: string): void {
    this.setQuantity(variantId, 0);
  }

  /** Puts back a bag saved earlier in this browser. */
  restore(lines: readonly CartLine[]): void {
    this.lines.set([...lines]);
  }

  clearNotice(): void {
    this.notice.set('');
  }

  clear(): void {
    this.lines.set([]);
  }

  private refuse(reason: string): AddOutcome {
    this.notice.set(reason);
    return { added: false, reason };
  }

  /** What the bag costs reaching the client this way; read inside a computed, it follows the bag. */
  quoteFor(delivery: DeliveryMethod): OrderQuote | null {
    const lines = this.lines();
    if (lines.length === 0) {
      return null;
    }
    try {
      return quoteOrder(lines, this.catalog.pieces(), delivery);
    } catch {
      // A line the floor can no longer fill shows in the bag; checkout waits until it is fixed.
      return null;
    }
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
