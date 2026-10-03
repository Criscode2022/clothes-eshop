export const CATEGORIES = [
  { slug: 'outerwear', name: 'Outerwear' },
  { slug: 'knitwear', name: 'Knitwear' },
  { slug: 'trousers', name: 'Trousers' },
  { slug: 'shirts', name: 'Shirts' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export interface Variant {
  readonly id: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: CategorySlug;
  readonly priceCents: number;
  readonly summary: string;
  readonly composition?: string;
  readonly care?: string;
  readonly variants: readonly Variant[];
}

export const SEED_PRODUCTS: readonly Product[] = [
  {
    id: 'wool-overcoat',
    name: 'Charcoal Wool Overcoat',
    category: 'outerwear',
    priceCents: 42_000,
    summary: 'A heavy wool coat, cut long, with a horn button and a full lining.',
    variants: [
      { id: 'wool-overcoat-46-charcoal', size: '46', color: 'Charcoal', stock: 4 },
      { id: 'wool-overcoat-48-charcoal', size: '48', color: 'Charcoal', stock: 2 },
      { id: 'wool-overcoat-50-camel', size: '50', color: 'Camel', stock: 3 },
    ],
  },
  {
    id: 'field-jacket',
    name: 'Camel Field Jacket',
    category: 'outerwear',
    priceCents: 26_800,
    summary: 'Cotton twill, unlined, with a throat latch and deep pockets.',
    variants: [
      { id: 'field-jacket-46-camel', size: '46', color: 'Camel', stock: 5 },
      { id: 'field-jacket-48-camel', size: '48', color: 'Camel', stock: 1 },
    ],
  },
  {
    id: 'merino-crew',
    name: 'Merino Crew Neck',
    category: 'knitwear',
    priceCents: 9_800,
    summary: 'Fine merino, knitted tight enough to sit under a jacket.',
    variants: [
      { id: 'merino-crew-s-ink', size: 'S', color: 'Ink', stock: 6 },
      { id: 'merino-crew-m-ink', size: 'M', color: 'Ink', stock: 6 },
      { id: 'merino-crew-l-ink', size: 'L', color: 'Ink', stock: 0 },
    ],
  },
  {
    id: 'ribbed-cardigan',
    name: 'Ribbed Cardigan',
    category: 'knitwear',
    priceCents: 14_800,
    summary: 'A long rib, oat yarn, with horn buttons and a patch pocket.',
    variants: [
      { id: 'ribbed-cardigan-s-oat', size: 'S', color: 'Oat', stock: 3 },
      { id: 'ribbed-cardigan-m-oat', size: 'M', color: 'Oat', stock: 3 },
      { id: 'ribbed-cardigan-l-oat', size: 'L', color: 'Oat', stock: 2 },
    ],
  },
  {
    id: 'pleated-trouser',
    name: 'Pleated Wool Trouser',
    category: 'trousers',
    priceCents: 18_600,
    summary: 'A single forward pleat, full through the thigh, plain hem.',
    variants: [
      { id: 'pleated-trouser-46-charcoal', size: '46', color: 'Charcoal', stock: 4 },
      { id: 'pleated-trouser-48-charcoal', size: '48', color: 'Charcoal', stock: 4 },
      { id: 'pleated-trouser-50-charcoal', size: '50', color: 'Charcoal', stock: 2 },
    ],
  },
  {
    id: 'wide-trouser',
    name: 'Wide Cotton Trouser',
    category: 'trousers',
    priceCents: 15_400,
    summary: 'Stone cotton with a wide leg and a flat front.',
    variants: [
      { id: 'wide-trouser-46-stone', size: '46', color: 'Stone', stock: 5 },
      { id: 'wide-trouser-48-stone', size: '48', color: 'Stone', stock: 5 },
    ],
  },
  {
    id: 'oxford-shirt',
    name: 'Oxford Cloth Shirt',
    category: 'shirts',
    priceCents: 8_900,
    summary: 'White oxford, button-down collar, a workroom staple.',
    variants: [
      { id: 'oxford-shirt-s-white', size: 'S', color: 'White', stock: 2 },
      { id: 'oxford-shirt-m-white', size: 'M', color: 'White', stock: 8 },
      { id: 'oxford-shirt-l-white', size: 'L', color: 'White', stock: 4 },
    ],
  },
  {
    id: 'silk-tunic',
    name: 'Silk Tunic',
    category: 'shirts',
    priceCents: 17_600,
    summary: 'Ivory silk, dropped shoulder, meant to be worn untucked.',
    variants: [
      { id: 'silk-tunic-s-ivory', size: 'S', color: 'Ivory', stock: 3 },
      { id: 'silk-tunic-m-ivory', size: 'M', color: 'Ivory', stock: 3 },
    ],
  },
];

export function categoryName(slug: string): string | null {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? null;
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return CATEGORIES.some((category) => category.slug === slug);
}

export function productsIn(products: readonly Product[], slug: string | null): Product[] {
  if (!slug) {
    return [...products];
  }
  return products.filter((product) => product.category === slug);
}

export function findProduct(products: readonly Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function findVariant(product: Product, variantId: string): Variant | undefined {
  return product.variants.find((variant) => variant.id === variantId);
}

const CLOTH_COLORS: Record<string, string> = {
  Charcoal: '#3c3a3b',
  Camel: '#b08968',
  Ink: '#1c2430',
  Oat: '#d9cbb8',
  Stone: '#cfc6b8',
  White: '#f7f4ee',
  Ivory: '#f3ead7',
};

export function clothColor(name: string): string {
  return CLOTH_COLORS[name] ?? 'transparent';
}

export function cloneProducts(products: readonly Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
  }));
}
