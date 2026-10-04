import { Injector, Service, effect, inject } from '@angular/core';
import { Bag } from './bag';
import { readStoredBag, writeStoredBag } from './bag-storage';
import type { CartLine } from './cart';
import { CatalogStore } from './catalog-store';

type BagStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Keeps the bag across reloads. The server never sees it, so this starts in the browser after the first render. */
@Service()
export class BagPersistence {
  private readonly bag = inject(Bag);
  private readonly catalog = inject(CatalogStore);
  private readonly injector = inject(Injector);

  start(storage: BagStorage): void {
    this.bag.restore(readStoredBag(storage, this.catalog.pieces()));
    effect(() => saveBag(storage, this.bag.items()), { injector: this.injector });
  }
}

function saveBag(storage: BagStorage, lines: readonly CartLine[]): void {
  try {
    writeStoredBag(storage, lines);
  } catch {
    // Full or blocked storage only means the bag is not kept after a reload; it still works on this page.
  }
}
