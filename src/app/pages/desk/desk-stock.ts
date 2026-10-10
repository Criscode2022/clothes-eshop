import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucidePackageCheck } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import type { Product, Variant } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { ShopClient } from '../../shop/shop-client';
import { stockNote, stockState } from '../../shop/stock';
import { PiecePhoto } from '../../ui/piece-photo';
import { ShopButtonImports } from '../../ui/shop-button';
import { StockField } from '../staff/stock-field';

/** Every size and color with its on-hand count, editable in place. */
@Component({
  selector: 'app-desk-stock',
  imports: [
    HlmAlertImports,
    HlmEmptyImports,
    HlmSkeleton,
    HlmTableImports,
    NgIcon,
    PiecePhoto,
    ShopButtonImports,
    StockField,
  ],
  providers: [provideIcons({ lucideCircleAlert, lucidePackageCheck })],
  templateUrl: './desk-stock.html',
  styleUrl: './desk-stock.scss',
})
export class DeskStock {
  private readonly catalog = inject(CatalogStore);
  private readonly shop = inject(ShopClient);

  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly stockNote = stockNote;
  protected readonly stockState = stockState;
  protected readonly lowOnly = signal(false);
  protected readonly pieces = computed(() =>
    this.catalog
      .pieces()
      .map((product) => ({
        product,
        variants: this.lowOnly() ? lowVariants(product) : product.variants,
      }))
      .filter((group) => group.variants.length > 0),
  );
  protected readonly lowCount = computed(() =>
    this.catalog.pieces().reduce((sum, product) => sum + lowVariants(product).length, 0),
  );

  constructor() {
    void this.load();
  }

  /** The counts on this page come from the server, not from whenever the floor was first opened. */
  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      await this.shop.loadCatalog();
      this.loadError.set('');
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Stock could not load.');
    } finally {
      this.loading.set(false);
    }
  }

  protected showLowOnly(event: Event): void {
    this.lowOnly.set((event.target as HTMLInputElement).checked);
  }

  protected label(product: Product, variant: Variant): string {
    return `${product.name}, ${variant.color} ${variant.size}`;
  }
}

function lowVariants(product: Product): readonly Variant[] {
  return product.variants.filter((variant) => stockState(variant.stock) !== 'in-stock');
}
