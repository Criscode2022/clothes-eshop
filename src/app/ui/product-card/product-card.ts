import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BagDrawer } from '../../shop/bag-drawer';
import { clothColor, isSoldOut, variantsByColor } from '../../shop/catalog';
import type { Product, Variant } from '../../shop/catalog';
import { MoneyPipe } from '../../shop/money.pipe';
import { Icon } from '../icon';
import { PiecePhoto } from '../piece-photo';

/** A piece on the floor. Its sizes open over the photograph, so a size goes into the bag without leaving the page. */
@Component({
  selector: 'app-product-card',
  imports: [Icon, MoneyPipe, PiecePhoto, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: { '(keydown.escape)': 'closeSizes()' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Loads the photograph first: set it on the pieces in the first screen. */
  readonly priority = input(false);

  private readonly drawer = inject(BagDrawer);
  private readonly quickAdd = viewChild<ElementRef<HTMLButtonElement>>('quickAdd');

  protected readonly clothColor = clothColor;
  protected readonly sizesOpen = signal(false);
  protected readonly panelId = computed(() => `sizes-${this.product().id}`);
  protected readonly colorGroups = computed(() => variantsByColor(this.product()));
  protected readonly colors = computed(() => this.colorGroups().map((group) => group.color));
  protected readonly soldOut = computed(() => isSoldOut(this.product()));

  protected toggleSizes(): void {
    this.sizesOpen.update((open) => !open);
  }

  protected closeSizes(): void {
    if (!this.sizesOpen()) {
      return;
    }
    this.sizesOpen.set(false);
    this.focusQuickAdd();
  }

  protected add(variant: Variant): void {
    this.sizesOpen.set(false);
    // Focus waits on the toggle, which stays visible, so it comes back here when the bag closes.
    this.focusQuickAdd();
    this.drawer.add(this.product().id, variant.id);
  }

  protected sizeLabel(variant: Variant): string {
    const color = this.colors().length > 1 ? `${variant.color} ` : '';
    const state = variant.stock < 1 ? ', sold out' : '';
    return `Add ${color}${variant.size} to bag${state}`;
  }

  private focusQuickAdd(): void {
    this.quickAdd()?.nativeElement.focus();
  }
}
