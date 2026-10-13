import type { CategorySlug, Product } from './catalog';

/**
 * The colors each seeded piece is photographed in. The first is its cover, `/garments/<id>.jpg`;
 * each other color is `/garments/<id>-<color>.jpg`.
 */
const PORTRAITS = new Map<string, readonly string[]>([
  ['wool-overcoat', ['Charcoal', 'Camel']],
  ['field-jacket', ['Camel']],
  ['merino-crew', ['Ink']],
  ['ribbed-cardigan', ['Oat']],
  ['pleated-trouser', ['Charcoal']],
  ['wide-trouser', ['Stone']],
  ['oxford-shirt', ['White']],
  ['silk-tunic', ['Ivory']],
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

/**
 * Portrait path for a seeded piece in a cloth color, or its cover when no color is given.
 * A color nobody photographed has none, so a piece is never shown in a color it is not.
 * Owner-added pieces have no photograph yet.
 */
export function portraitSrc(id: string, color = ''): string | null {
  const colors = PORTRAITS.get(id);
  if (!colors) {
    return null;
  }
  if (!color || color === colors[0]) {
    return `/garments/${id}.jpg`;
  }
  return colors.includes(color) ? `/garments/${id}-${color.toLowerCase()}.jpg` : null;
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
