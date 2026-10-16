import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { Language } from '../../i18n/language';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { translate } from '../../i18n/translate';
import { BagDrawer } from '../../shop/bag-drawer';
import { clothColor, isSoldOut, variantsByColor } from '../../shop/catalog';
import type { Product, Variant } from '../../shop/catalog';
import { MoneyPipe } from '../../shop/money.pipe';
import { PiecePhoto } from '../piece-photo';

/** A piece on the floor. Its sizes open over the photograph, so a size goes into the bag without leaving the page. */
@Component({
  selector: 'app-product-card',
  imports: [HlmBadge, MoneyPipe, NgIcon, PiecePhoto, RouterLink, TranslatePipe],
  providers: [provideIcons({ lucidePlus })],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: { '(keydown.escape)': 'closeSizes()' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Loads the photograph first: set it on the pieces in the first screen. */
  readonly priority = input(false);

  private readonly drawer = inject(BagDrawer);
  private readonly language = inject(Language);
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
    const locale = this.language.locale();
    const size = variant.size;
    const soldOut = variant.stock < 1;
    if (this.colors().length > 1) {
      return translate(
        locale,
        soldOut ? 'Add {color} {size} to bag, sold out' : 'Add {color} {size} to bag',
        { color: translate(locale, variant.color), size },
      );
    }
    return translate(locale, soldOut ? 'Add {size} to bag, sold out' : 'Add {size} to bag', {
      size,
    });
  }

  private focusQuickAdd(): void {
    this.quickAdd()?.nativeElement.focus();
  }
}
