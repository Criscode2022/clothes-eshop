import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideStore, lucideTruck } from '@ng-icons/lucide';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { BagDrawer } from '../../shop/bag-drawer';
import { categoryName, clothColor, variantsByColor } from '../../shop/catalog';
import { BackLink } from '../../ui/back-link';
import { Breadcrumb } from '../../ui/breadcrumb';
import { CatalogStore } from '../../shop/catalog-store';
import { careOf, compositionOf, fitNote, morePieces } from '../../shop/cloth';
import { FREE_SHIPPING_FROM_CENTS } from '../../shop/money';
import { MoneyPipe } from '../../shop/money.pipe';
import { stockNote, stockState } from '../../shop/stock';
import { PhotoLoupe } from '../../ui/photo-loupe';
import { PiecePhoto } from '../../ui/piece-photo';
import { ProductCard } from '../../ui/product-card/product-card';
import { Reveal } from '../../ui/reveal';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-product',
  imports: [
    BackLink,
    Breadcrumb,
    HlmAccordionImports,
    HlmEmptyImports,
    MoneyPipe,
    NgIcon,
    PhotoLoupe,
    PiecePhoto,
    ProductCard,
    Reveal,
    RouterLink,
    ShopButtonImports,
  ],
  providers: [provideIcons({ lucideBanknote, lucideStore, lucideTruck })],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class ProductPage {
  readonly id = input.required<string>();
  private readonly catalog = inject(CatalogStore);
  private readonly drawer = inject(BagDrawer);
  private readonly sizeGroup = viewChild<ElementRef<HTMLElement>>('sizeGroup');
  private readonly buyButton = viewChild<ElementRef<HTMLElement>>('buyButton');

  protected readonly clothColor = clothColor;
  protected readonly product = computed(() => this.catalog.product(this.id()));
  protected readonly categoryName = computed(
    () => categoryName(this.product()?.category ?? '') ?? '',
  );
  protected readonly more = computed(() => {
    const product = this.product();
    return product ? morePieces(this.catalog.pieces(), product) : [];
  });
  protected readonly colorGroups = computed(() => {
    const product = this.product();
    return product ? variantsByColor(product) : [];
  });
  protected readonly color = linkedSignal(() => {
    const groups = this.colorGroups();
    return (
      (groups.find((group) => group.variants.some((variant) => variant.stock > 0)) ?? groups[0])
        ?.color ?? ''
    );
  });
  /** The photograph follows the chosen color, so its description names it. */
  protected readonly photoAlt = computed(() => {
    const name = this.product()?.name ?? '';
    return this.color() ? `${name} in ${this.color()}` : name;
  });
  protected readonly sizes = computed(
    () => this.colorGroups().find((group) => group.color === this.color())?.variants ?? [],
  );
  /** A size is chosen for the shopper only when it is the one size left in this color. */
  protected readonly sizeId = linkedSignal(() => {
    const available = this.sizes().filter((variant) => variant.stock > 0);
    return available.length === 1 ? available[0].id : '';
  });
  protected readonly variant = computed(
    () => this.sizes().find((item) => item.id === this.sizeId()) ?? null,
  );
  protected readonly stock = computed(() => {
    const variant = this.variant();
    return variant ? { note: stockNote(variant.stock), state: stockState(variant.stock) } : null;
  });
  protected readonly composition = computed(() => {
    const product = this.product();
    return product ? compositionOf(product) : '';
  });
  protected readonly care = computed(() => {
    const product = this.product();
    return product ? careOf(product) : '';
  });
  protected readonly fit = computed(() => {
    const product = this.product();
    return product ? fitNote(product.category) : '';
  });
  protected readonly shipsFree = computed(
    () => (this.product()?.priceCents ?? 0) >= FREE_SHIPPING_FROM_CENTS,
  );
  protected readonly sizeHintShown = signal(false);
  /** On a phone the buy button scrolls away under the photograph; a bar keeps it in reach. */
  protected readonly buyBarShown = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const button = this.buyButton()?.nativeElement;
      if (!button || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observer = new IntersectionObserver(([entry]) =>
        this.buyBarShown.set(!entry?.isIntersecting),
      );
      observer.observe(button);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected chooseColor(color: string): void {
    this.color.set(color);
    this.sizeHintShown.set(false);
  }

  protected chooseSize(variantId: string): void {
    this.sizeId.set(variantId);
    this.sizeHintShown.set(false);
  }

  protected addToBag(): void {
    const product = this.product();
    const variant = this.variant();
    if (!product) {
      return;
    }
    if (!variant) {
      this.sizeHintShown.set(true);
      this.sizeGroup()?.nativeElement.focus();
      return;
    }
    this.drawer.add(product.id, variant.id);
  }
}
