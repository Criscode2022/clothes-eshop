import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormField, form, min, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { Language } from '../../i18n/language';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { categoryName } from '../../shop/catalog';
import type { Product } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { centsFromDollars, dollarsFromCents } from '../../shop/money';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { PiecePhoto } from '../../ui/piece-photo';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';
import { wholeStock } from '../../ui/form-rules';
import { StockField, stockControlLabel } from '../staff/stock-field';

/** Every piece on one side, the chosen one's price, sizes, and stock on the other. */
@Component({
  selector: 'app-owner-pieces',
  imports: [
    FormField,
    HlmAlertImports,
    HlmSkeleton,
    HlmTableImports,
    MoneyPipe,
    NgIcon,
    PiecePhoto,
    RouterLink,
    ShopButtonImports,
    StockField,
    TextField,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideCircleAlert })],
  templateUrl: './owner-pieces.html',
  styleUrl: './owner-pieces.scss',
})
export class OwnerPieces {
  /** The piece in the editor, read from ?piece= so it can be linked to and kept on reload. */
  readonly piece = input<string>();

  private readonly catalog = inject(CatalogStore);
  private readonly shop = inject(ShopClient);
  private readonly language = inject(Language);

  protected readonly categoryName = categoryName;
  protected readonly pieces = this.catalog.pieces;
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly selected = computed(
    () => this.catalog.product(this.piece() ?? '') ?? this.catalog.pieces()[0] ?? null,
  );
  /** Saving swaps in a new copy of the piece; messages reset only when a different piece is chosen. */
  private readonly selectedId = computed(() => this.selected()?.id ?? '');

  private readonly selectedPrice = computed(() => this.selected()?.priceCents ?? 0);
  protected readonly priceModel = linkedSignal(() => ({
    dollars: dollarsFromCents(this.selectedPrice()),
  }));
  protected readonly priceForm = form(this.priceModel, (path) => {
    min(path.dollars, 0.01, { message: 'Enter a price above $0.00.' });
  });
  protected readonly priceStatus = linkedSignal({ source: this.selectedId, computation: () => '' });

  protected readonly variantModel = signal({ size: '', color: '', stock: 1 });
  protected readonly variantForm = form(this.variantModel, (path) => {
    required(path.size, { message: 'Enter a size, like 48 or M.' });
    required(path.color, { message: 'Enter a color, like Charcoal.' });
    wholeStock(path.stock);
  });
  protected readonly variantStatus = linkedSignal({
    source: this.selectedId,
    computation: () => '',
  });

  constructor() {
    void this.load();
  }

  protected totalStock(product: Product): number {
    return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  }

  protected stockLabel(name: string, color: string, size: string): string {
    return stockControlLabel(this.language.locale(), name, color, size);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      await this.shop.loadCatalog();
      this.loadError.set('');
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'The pieces could not load.');
    } finally {
      this.loading.set(false);
    }
  }

  protected savePrice(): void {
    const piece = this.selected();
    if (!piece) {
      return;
    }
    void submit(this.priceForm, async () => {
      try {
        const saved = await this.shop.setPrice(
          piece.id,
          centsFromDollars(this.priceModel().dollars),
        );
        this.priceStatus.set(`Saved. ${saved.name} now shows at the new price.`);
      } catch (error) {
        this.priceStatus.set(
          error instanceof Error ? error.message : 'The price could not be saved.',
        );
      }
    });
  }

  protected addVariant(): void {
    const piece = this.selected();
    if (!piece) {
      return;
    }
    void submit(this.variantForm, async () => {
      const { size, color, stock } = this.variantModel();
      try {
        await this.shop.addVariant(piece.id, size, color, stock);
        this.variantModel.set({ size: '', color: '', stock: 1 });
        this.variantForm().reset();
        this.variantStatus.set(`Added ${color} ${size}.`);
      } catch (error) {
        this.variantStatus.set(
          error instanceof Error ? error.message : 'The size could not be added.',
        );
      }
    });
  }
}
