import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CATEGORIES, productsIn } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { fitNote } from '../../shop/cloth';
import { ProductCard } from '../../ui/product-card/product-card';
import { Reveal } from '../../ui/reveal';
import { CategoryIndex } from './category-index';
import { ClothNote } from './cloth-note';
import { OpeningSpread } from './opening-spread';
import { Breadcrumb } from '../../ui/breadcrumb';

/** The floor: every piece, or one category of them. */
@Component({
  selector: 'app-catalog',
  imports: [
    Breadcrumb,
    CategoryIndex,
    ClothNote,
    HlmEmptyImports,
    NgIcon,
    NgTemplateOutlet,
    OpeningSpread,
    ProductCard,
    Reveal,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
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

  protected countIn(slug: string | null): number {
    return productsIn(this.catalog.pieces(), slug).length;
  }
}
