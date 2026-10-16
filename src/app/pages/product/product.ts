import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideStore, lucideTruck, lucideX } from '@ng-icons/lucide';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { Language } from '../../i18n/language';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { translate } from '../../i18n/translate';
import { BagDrawer } from '../../shop/bag-drawer';
import { categoryName, clothColor, variantsByColor } from '../../shop/catalog';
import { BackLink } from '../../ui/back-link';
import { Breadcrumb } from '../../ui/breadcrumb';
import { CatalogStore } from '../../shop/catalog-store';
import { careOf, compositionOf, fitNote, morePieces, portraitOf } from '../../shop/cloth';
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
    NgOptimizedImage,
    NgTemplateOutlet,
    PhotoLoupe,
    PiecePhoto,
    ProductCard,
    Reveal,
    RouterLink,
    ShopButtonImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideBanknote, lucideStore, lucideTruck, lucideX })],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class ProductPage {
  readonly id = input.required<string>();
  /** The color a card was showing, carried on `?color=`. Absent, the page opens on the cover. */
  readonly openingColor = input<string | undefined>(undefined, { alias: 'color' });
  private readonly catalog = inject(CatalogStore);
  private readonly language = inject(Language);
  private readonly drawer = inject(BagDrawer);
  private readonly sizeGroup = viewChild<ElementRef<HTMLElement>>('sizeGroup');
  private readonly buyButton = viewChild<ElementRef<HTMLElement>>('buyButton');
  private readonly viewer = viewChild<ElementRef<HTMLDialogElement>>('viewer');
  private pageAlive = true;
  private returnFocus: HTMLElement | null = null;

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
  /** Opens on the color the address asks for, or the cover when that color is still in stock. */
  protected readonly color = linkedSignal(() => {
    const groups = this.colorGroups();
    const asked = groups.find((group) => group.color === this.openingColor());
    if (asked) {
      return asked.color;
    }
    const piece = this.product();
    const cover = piece ? portraitOf(piece.id)?.avif : undefined;
    const opening =
      piece && cover
        ? groups.find(
            (group) =>
              portraitOf(piece.id, group.color)?.avif === cover &&
              group.variants.some((variant) => variant.stock > 0),
          )
        : undefined;
    return (
      (opening ??
        groups.find((group) => group.variants.some((variant) => variant.stock > 0)) ??
        groups[0]
      )?.color ?? ''
    );
  });
  /** The photograph of the chosen color, when this piece has one. */
  protected readonly portrait = computed(() => {
    const piece = this.product();
    return piece ? portraitOf(piece.id, this.color()) : null;
  });
  /** Another piece starts with the photograph at page size. */
  protected readonly photoOpen = linkedSignal({
    source: this.id,
    computation: () => false,
  });
  /** The photograph follows the chosen color, so its description names it. */
  protected readonly photoAlt = computed(() => {
    const locale = this.language.locale();
    const name = translate(locale, this.product()?.name ?? '');
    const color = this.color();
    return color
      ? translate(locale, '{name} in {color}', { name, color: translate(locale, color) })
      : name;
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
    destroyRef.onDestroy(() => {
      this.pageAlive = false;
      const dialog = this.viewer()?.nativeElement;
      if (dialog?.open) {
        dialog.close();
      }
    });
    // The photograph is in the dialog before it opens, and a piece change closes it while it is still there.
    afterRenderEffect({
      earlyRead: () => {
        const dialog = this.viewer()?.nativeElement ?? null;
        return {
          dialog,
          open: dialog?.open ?? false,
          connected: dialog?.isConnected ?? false,
          closeButton: dialog?.querySelector<HTMLElement>('.viewer__close') ?? null,
          show: this.photoOpen() && this.portrait() !== null,
        };
      },
      write: (state) => {
        const current = state();
        const dialog = current.dialog;
        if (!dialog || !current.connected) {
          return;
        }
        if (current.show && !current.open) {
          dialog.showModal();
          current.closeButton?.focus({ preventScroll: true });
        } else if (!current.show && current.open) {
          dialog.close();
        }
      },
    });
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

  protected openPhoto(event: Event): void {
    if (!this.portrait()) {
      return;
    }
    const opener = event.currentTarget;
    this.returnFocus = opener instanceof HTMLElement ? opener : null;
    this.photoOpen.set(true);
  }

  /** Puts the photograph back at page size. */
  protected closePhoto(): void {
    const dialog = this.viewer()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
      return;
    }
    this.photoOpen.set(false);
  }

  protected photoDismissed(): void {
    if (!this.pageAlive) {
      return;
    }
    this.photoOpen.set(false);
    const back = this.returnFocus;
    this.returnFocus = null;
    if (!back) {
      return;
    }
    queueMicrotask(() => {
      if (this.pageAlive && back.isConnected) {
        back.focus({ preventScroll: true });
      }
    });
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
