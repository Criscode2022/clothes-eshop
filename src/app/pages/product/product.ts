import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bag } from '../../shop/bag';
import { categoryName } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { careOf, compositionOf, fitNote, portraitSrc, relatedPieces } from '../../shop/cloth';
import { MoneyPipe } from '../../shop/money.pipe';

@Component({
  selector: 'app-product',
  imports: [NgOptimizedImage, RouterLink, MoneyPipe],
  templateUrl: './product.html',
})
export class ProductPage {
  readonly id = input.required<string>();
  private readonly catalog = inject(CatalogStore);
  private readonly bag = inject(Bag);

  protected readonly portraitSrc = portraitSrc;
  protected readonly compositionOf = compositionOf;
  protected readonly careOf = careOf;
  protected readonly fitNote = fitNote;
  protected readonly categoryName = categoryName;
  protected readonly product = computed(() => this.catalog.product(this.id()));
  protected readonly related = computed(() => {
    const product = this.product();
    return product ? relatedPieces(this.catalog.pieces(), product) : [];
  });
  protected readonly colors = computed(() => [
    ...new Set(this.product()?.variants.map((variant) => variant.color) ?? []),
  ]);
  protected readonly color = linkedSignal(() => {
    const product = this.product();
    const variant = product?.variants.find((item) => item.stock > 0) ?? product?.variants[0];
    return variant?.color ?? '';
  });
  protected readonly sizes = computed(
    () => this.product()?.variants.filter((variant) => variant.color === this.color()) ?? [],
  );
  protected readonly size = linkedSignal(() => {
    const sizes = this.sizes();
    return (sizes.find((variant) => variant.stock > 0) ?? sizes[0])?.size ?? '';
  });
  protected readonly variant = computed(
    () => this.sizes().find((item) => item.size === this.size()) ?? null,
  );

  protected chooseColor(color: string): void {
    this.color.set(color);
  }

  protected chooseSize(size: string): void {
    this.size.set(size);
  }

  protected addToBag(): void {
    const product = this.product();
    const variant = this.variant();
    if (!product || !variant) {
      return;
    }
    this.bag.add(product.id, variant.id);
  }
}
