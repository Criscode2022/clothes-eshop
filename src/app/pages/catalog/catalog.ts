import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES, categoryName, clothColor, productsIn } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { compositionOf, portraitSrc } from '../../shop/cloth';
import { MoneyPipe } from '../../shop/money.pipe';

@Component({
  selector: 'app-catalog',
  imports: [NgOptimizedImage, RouterLink, MoneyPipe],
  templateUrl: './catalog.html',
})
export class Catalog {
  readonly slug = input<string>();
  private readonly catalog = inject(CatalogStore);

  protected readonly categories = CATEGORIES;
  protected readonly clothColor = clothColor;
  protected readonly portraitSrc = portraitSrc;
  protected readonly compositionOf = compositionOf;
  protected readonly category = computed(() => {
    const slug = this.slug();
    return slug ? categoryName(slug) : null;
  });
  protected readonly unknownCategory = computed(() => {
    const slug = this.slug();
    return slug !== undefined && slug.length > 0 && categoryName(slug) === null;
  });
  protected readonly pieces = computed(() =>
    this.unknownCategory() ? [] : productsIn(this.catalog.pieces(), this.slug() ?? null),
  );
  protected readonly lead = computed(() => this.pieces()[0] ?? null);
}
