import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePause, lucidePlay } from '@ng-icons/lucide';
import type { Product } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { portraitOf } from '../../shop/cloth';
import type { Portrait } from '../../shop/cloth';
import { MoneyPipe } from '../../shop/money.pipe';
import { SlideShow } from '../../ui/slide-show';
import { SlideTrack } from '../../ui/slide-track';

/** The three photographs of the opening spread: the outer two hold the window light at either edge. */
const SPREAD = ['oxford-shirt', 'wool-overcoat', 'field-jacket'];

interface SpreadTile {
  readonly piece: Product;
  readonly photo: Portrait;
}

/**
 * The floor's opening photographs: three edge to edge from a tablet up, and on a phone one at a
 * time, taking turns or swiped sideways, with a marker under them for each and a pause button.
 */
@Component({
  selector: 'app-opening-spread',
  imports: [MoneyPipe, NgIcon, NgOptimizedImage, RouterLink, SlideShow, SlideTrack],
  providers: [provideIcons({ lucidePause, lucidePlay })],
  templateUrl: './opening-spread.html',
  styleUrl: './opening-spread.scss',
})
export class OpeningSpread {
  private readonly catalog = inject(CatalogStore);

  protected readonly tiles = computed(() => spreadOf(this.catalog.pieces()));
}

function spreadOf(products: readonly Product[]): SpreadTile[] {
  return SPREAD.flatMap((id) => {
    const piece = products.find((product) => product.id === id);
    const photo = portraitOf(id);
    return piece && photo ? [{ piece, photo }] : [];
  });
}
