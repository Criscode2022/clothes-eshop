import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { CATEGORIES, productsIn } from '../../shop/catalog';
import type { Product } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { fitNote, portraitSrc } from '../../shop/cloth';
import { MoneyPipe } from '../../shop/money.pipe';
import { ProductCard } from '../../ui/product-card/product-card';
import { Reveal } from '../../ui/reveal';
import { CategoryIndex } from './category-index';
import { ClothNote } from './cloth-note';

/** The three photographs of the opening spread: the outer two hold the window light at either edge. */
const SPREAD = ['oxford-shirt', 'wool-overcoat', 'field-jacket'];

/** The floor: every piece, or one category of them. */
@Component({
  selector: 'app-catalog',
  imports: [
    CategoryIndex,
    ClothNote,
    HlmEmptyImports,
    MoneyPipe,
    NgIcon,
    NgOptimizedImage,
    NgTemplateOutlet,
    ProductCard,
    Reveal,
    RouterLink,
    RouterLinkActive,
  ],
  providers: [provideIcons({ lucideCheck })],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog {
  readonly slug = input<string>();
  private readonly catalog = inject(CatalogStore);

  protected readonly categories = CATEGORIES;
  protected readonly isFloor = computed(() => !this.slug());
  protected readonly category = computed(
    () => CATEGORIES.find((item) => item.slug === this.slug()) ?? null,
  );
  protected readonly pieces = computed(() => {
    const slug = this.slug();
    return !slug || this.category() ? productsIn(this.catalog.pieces(), slug ?? null) : [];
  });
  protected readonly fit = computed(() => {
    const category = this.category();
    return category ? fitNote(category.slug) : '';
  });
  protected readonly spread = computed(() => spreadOf(this.catalog.pieces()));

  protected countIn(slug: string | null): number {
    return productsIn(this.catalog.pieces(), slug).length;
  }
}

function spreadOf(
  products: readonly Product[],
): { readonly piece: Product; readonly src: string }[] {
  return SPREAD.flatMap((id) => {
    const piece = products.find((product) => product.id === id);
    const src = portraitSrc(id);
    return piece && src ? [{ piece, src }] : [];
  });
}
