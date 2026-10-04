import { findProduct, findVariant } from './catalog';
import type { Product } from './catalog';
import type { CartLine } from './cart';

const BAG_KEY = 'marlow.bag';

/** The bag this browser saved, keeping only sizes still on the floor and capping each at its stock. */
export function readStoredBag(
  storage: Pick<Storage, 'getItem'>,
  products: readonly Product[],
): CartLine[] {
  return parseLines(storage.getItem(BAG_KEY)).flatMap((line) => {
    const product = findProduct(products, line.productId);
    const stock = (product && findVariant(product, line.variantId)?.stock) ?? 0;
    const quantity = Math.min(line.quantity, stock);
    return quantity > 0 ? [{ productId: line.productId, variantId: line.variantId, quantity }] : [];
  });
}

export function writeStoredBag(
  storage: Pick<Storage, 'setItem'>,
  lines: readonly CartLine[],
): void {
  storage.setItem(BAG_KEY, JSON.stringify(lines));
}

function parseLines(saved: string | null): CartLine[] {
  if (!saved) {
    return [];
  }
  try {
    const value: unknown = JSON.parse(saved);
    return Array.isArray(value) ? value.filter(isCartLine) : [];
  } catch {
    return [];
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { productId, variantId, quantity } = value as Record<string, unknown>;
  return (
    typeof productId === 'string' &&
    typeof variantId === 'string' &&
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}
