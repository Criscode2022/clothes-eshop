import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Product } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { portraitSrc } from '../../shop/cloth';
import { MoneyPipe } from '../../shop/money.pipe';
import { SlideTrack } from '../../ui/slide-track';

/** The three photographs of the opening spread: the outer two hold the window light at either edge. */
const SPREAD = ['oxford-shirt', 'wool-overcoat', 'field-jacket'];

interface SpreadTile {
  readonly piece: Product;
  readonly src: string;
}

/**
 * The floor's opening photographs: three edge to edge from a tablet up, and on a phone one at a
 * time, swiped sideways, with a marker under them for each.
 */
@Component({
  selector: 'app-opening-spread',
  imports: [MoneyPipe, NgOptimizedImage, RouterLink, SlideTrack],
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
    const src = portraitSrc(id);
    return piece && src ? [{ piece, src }] : [];
  });
}
