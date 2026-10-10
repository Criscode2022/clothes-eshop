import { isSoldOut } from './catalog';
import type { CategorySlug, Product } from './catalog';

const PORTRAITS = new Set([
  'wool-overcoat',
  'field-jacket',
  'merino-crew',
  'ribbed-cardigan',
  'pleated-trouser',
  'wide-trouser',
  'oxford-shirt',
  'silk-tunic',
]);

const NOTES: Record<string, { readonly composition: string; readonly care: string }> = {
  'wool-overcoat': {
    composition: '100% wool melton, cupro lining.',
    care: 'Brush and air it. Press with a cloth. Dry clean when the lining dulls.',
  },
  'field-jacket': {
    composition: 'Cotton twill, unlined.',
    care: 'Cold wash, hang dry, and press the collar flat.',
  },
  'merino-crew': {
    composition: 'Extrafine merino wool.',
    care: 'Hand wash cold and dry flat. Do not tumble.',
  },
  'ribbed-cardigan': {
    composition: 'Wool and cotton rib.',
    care: 'Hand wash cold, reshape the rib, and dry flat.',
  },
  'pleated-trouser': {
    composition: 'Wool twill.',
    care: 'Steam the pleat from the inside. Dry clean.',
  },
  'wide-trouser': {
    composition: 'Washed cotton.',
    care: 'Machine wash cold and hang dry. Press a crease only if you want one.',
  },
  'oxford-shirt': {
    composition: 'Oxford cotton cloth.',
    care: 'Machine wash warm, hang dry, and press the collar while it is damp.',
  },
  'silk-tunic': {
    composition: 'Silk twill.',
    care: 'Dry clean. Steam from the inside.',
  },
};

const FIT: Record<CategorySlug, string> = {
  outerwear:
    'Coat sizes are European chest sizes. The overcoat is cut to clear a knit. Between two sizes, take the larger.',
  knitwear:
    'Letter sizes follow the body, not the coat. The merino sits close. The cardigan has ease through the sleeve.',
  trousers:
    'Waist sizes use the same numbers as the coats. The pleated wool is full in the thigh. The cotton is straight from the hip.',
  shirts:
    'The oxford is a dress-shirt fit. The silk tunic is cut loose and meant to be worn untucked.',
};

/** Portrait path for a seeded piece. Owner-added pieces have no photograph yet. */
export function portraitSrc(id: string): string | null {
  return PORTRAITS.has(id) ? `/garments/${id}.jpg` : null;
}

export function compositionOf(product: Product): string {
  return product.composition?.trim() || NOTES[product.id]?.composition || '';
}

export function careOf(product: Product): string {
  return product.care?.trim() || NOTES[product.id]?.care || '';
}

export function fitNote(category: CategorySlug): string {
  return FIT[category];
}

/** Other pieces in the same category, in floor order. */
export function relatedPieces(products: readonly Product[], product: Product): Product[] {
  return products.filter((item) => item.category === product.category && item.id !== product.id);
}

/** Up to `count` other pieces to show under a piece: its own category first, then the rest of the floor in order. */
export function morePieces(products: readonly Product[], product: Product, count = 4): Product[] {
  const elsewhere = products.filter((item) => item.category !== product.category);
  return [...relatedPieces(products, product), ...elsewhere].slice(0, count);
}

/**
 * Pieces to show beside a bag: the floor around the first piece in it, without anything already in
 * the bag or sold out. An empty bag has nothing to pair with.
 */
export function piecesToPairWith(
  products: readonly Product[],
  bagPieceIds: readonly string[],
  count = 4,
): Product[] {
  const first = products.find((product) => product.id === bagPieceIds[0]);
  if (!first) {
    return [];
  }
  const inBag = new Set(bagPieceIds);
  return morePieces(products, first, products.length)
    .filter((product) => !inBag.has(product.id) && !isSoldOut(product))
    .slice(0, count);
}
