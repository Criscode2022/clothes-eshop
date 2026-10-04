import { isPlatformServer } from '@angular/common';
import {
  InjectionToken,
  PLATFORM_ID,
  Service,
  TransferState,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { SEED_PRODUCTS, cloneProducts, findProduct } from './catalog';
import type { Product } from './catalog';

const CATALOG_KEY = makeStateKey<Product[]>('marlow-catalog');

export interface CatalogSource {
  products(): readonly Product[];
}

/** Browser and unit tests read the seed. The server overrides this with the live book. */
export const CATALOG_SOURCE = new InjectionToken<CatalogSource>('CATALOG_SOURCE', {
  providedIn: 'root',
  factory: () => ({ products: () => cloneProducts(SEED_PRODUCTS) }),
});

@Service()
export class CatalogStore {
  private readonly source = inject(CATALOG_SOURCE);
  private readonly transfer = inject(TransferState, { optional: true });
  private readonly products = signal<readonly Product[]>(this.readInitial());

  readonly pieces = this.products.asReadonly();

  product(id: string): Product | undefined {
    return findProduct(this.products(), id);
  }

  replace(product: Product): void {
    this.products.update((products) =>
      products.some((item) => item.id === product.id)
        ? products.map((item) => (item.id === product.id ? product : item))
        : [...products, product],
    );
  }

  /** Takes the whole floor as the server holds it now. */
  replaceAll(products: readonly Product[]): void {
    this.products.set(cloneProducts(products));
  }

  private readInitial(): readonly Product[] {
    if (isPlatformServer(inject(PLATFORM_ID))) {
      const products = cloneProducts(this.source.products());
      this.transfer?.set(CATALOG_KEY, products);
      return products;
    }
    if (this.transfer?.hasKey(CATALOG_KEY)) {
      return this.transfer.get(CATALOG_KEY, []);
    }
    return cloneProducts(this.source.products());
  }
}
