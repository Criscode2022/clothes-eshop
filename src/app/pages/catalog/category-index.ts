import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES, productsIn } from '../../shop/catalog';
import type { CategorySlug, Product } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { portraitOf } from '../../shop/cloth';
import type { Portrait } from '../../shop/cloth';
import { Reveal } from '../../ui/reveal';

/** The photograph that stands for each category in the index under the floor. */
const CATEGORY_COVERS: Record<CategorySlug, string> = {
  outerwear: 'field-jacket',
  knitwear: 'ribbed-cardigan',
  trousers: 'pleated-trouser',
  shirts: 'silk-tunic',
};

interface Cover {
  readonly slug: CategorySlug;
  readonly name: string;
  readonly count: number;
  readonly photo: Portrait;
}

/** The four rooms of the floor, one photograph each, leading to the category pages and their fit notes. */
@Component({
  selector: 'app-category-index',
  imports: [NgOptimizedImage, Reveal, RouterLink],
  template: `
    @if (covers().length > 0) {
      <section class="rooms page" aria-labelledby="rooms-title">
        <h2 id="rooms-title" class="rooms__title" appReveal>Shop by category</h2>
        <ul class="rooms__grid" role="list">
          @for (cover of covers(); track cover.slug; let index = $index) {
            <li appReveal [revealOrder]="index">
              <a class="room" [routerLink]="['/category', cover.slug]">
                <span class="room__photo">
                  <picture>
                    <source type="image/avif" [srcset]="cover.photo.avif" />
                    <source type="image/jpeg" [srcset]="cover.photo.jpeg" />
                    <img [ngSrc]="cover.photo.avif" width="800" height="1200" alt="" />
                  </picture>
                </span>
                <span class="room__name">{{ cover.name }}</span>
                <span class="room__count">
                  {{ cover.count }} {{ cover.count === 1 ? 'piece' : 'pieces' }}
                </span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .rooms {
      display: grid;
      gap: 1.5rem;
      margin-top: 6rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--color-border);
    }

    .rooms__title {
      font-size: var(--text-md);
      letter-spacing: 0;
    }

    .rooms__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2.5rem 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;

      @media (min-width: 48rem) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
      }
    }

    .room {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.25rem 1rem;
      font-size: var(--text-ui);
      text-decoration: none;
    }

    .room__photo {
      grid-column: 1 / -1;
      margin-bottom: 0.625rem;
      overflow: hidden;
      aspect-ratio: 2 / 3;
      background: var(--color-surface);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: scale var(--duration-photo) var(--ease-out);
      }
    }

    .room__name {
      font-weight: 500;
    }

    .room__count {
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
    }

    @media (hover: hover) {
      .room:hover img {
        scale: 1.045;
      }
    }
  `,
})
export class CategoryIndex {
  private readonly catalog = inject(CatalogStore);
  protected readonly covers = computed(() => coversOf(this.catalog.pieces()));
}

/** One photograph per category, skipping any category whose cover piece has no photograph or no pieces left. */
function coversOf(products: readonly Product[]): Cover[] {
  return CATEGORIES.flatMap(({ slug, name }) => {
    const photo = portraitOf(CATEGORY_COVERS[slug]);
    const count = productsIn(products, slug).length;
    return photo && count > 0 ? [{ slug, name, count, photo }] : [];
  });
}
