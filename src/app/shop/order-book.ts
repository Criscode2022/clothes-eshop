import {
  canAdministerCatalog,
  canCancelOrder,
  canChangeFulfillment,
  canChangePrice,
  canChangeStock,
  canReadOrder,
  ordersVisibleTo,
} from './access';
import type { Actor } from './access';
import { assertDeliverable, normalizedShipping } from './address-rules';
import { ShopRuleError } from './cart';
import { cloneProducts, isCategorySlug, SEED_PRODUCTS } from './catalog';
import type { CategorySlug, Product, Variant } from './catalog';
import { assertCheckoutDraft, assertNoCardData, transitionFulfillment } from './checkout';
import type { CheckoutDraft, Fulfillment, ShopOrder } from './checkout';

export interface NewPiece {
  readonly name: string;
  readonly category: string;
  readonly priceCents: number;
  readonly summary: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
}

export interface NewVariant {
  readonly size: string;
  readonly color: string;
  readonly stock: number;
}

interface ShopState {
  products: Product[];
  orders: ShopOrder[];
  nextReference: number;
}

/**
 * Express and the Angular server bundle each inline this file.
 * A module-local `let` would be two books. Both copies read this process symbol.
 */
const SHOP_STATE = Symbol.for('marlow.shop.state');

function readState(): ShopState {
  const holder = globalThis as typeof globalThis & { [SHOP_STATE]?: ShopState };
  return (holder[SHOP_STATE] ??= freshState());
}

function writeState(next: ShopState): void {
  (globalThis as typeof globalThis & { [SHOP_STATE]?: ShopState })[SHOP_STATE] = next;
}

export function resetShop(): void {
  writeState(freshState());
}

export interface ShopSnapshot {
  products: Product[];
  orders: ShopOrder[];
  nextReference: number;
}

/** Both server bundles share this symbol, so a snapshot written here is the snapshot SSR reads. */
export function snapshotShop(): ShopSnapshot {
  const state = readState();
  return {
    products: cloneProducts(state.products),
    orders: state.orders.map(copyOrder),
    nextReference: state.nextReference,
  };
}

export function installShop(snapshot: ShopSnapshot): void {
  writeState({
    products: cloneProducts(snapshot.products),
    orders: snapshot.orders.map(copyOrder),
    nextReference: snapshot.nextReference,
  });
}

function copyOrder(order: ShopOrder): ShopOrder {
  return {
    ...order,
    contact: { ...order.contact },
    shipping: { ...order.shipping },
    lines: order.lines.map((line) => ({ ...line })),
  };
}

export function listCatalog(): Product[] {
  return cloneProducts(readState().products);
}

export function placeOrder(
  draft: CheckoutDraft,
  actor: Actor | null,
  rawBody: unknown = draft,
): ShopOrder {
  assertNoCardData(rawBody);
  const current = readState();
  assertDeliverable(draft.contact, draft.shipping);
  const quote = assertCheckoutDraft(draft, current.products);
  const order: ShopOrder = {
    reference: `MR-${current.nextReference}`,
    clientId: actor?.role === 'client' ? actor.id : null,
    contact: {
      name: draft.contact.name.trim(),
      email: draft.contact.email.trim(),
      phone: draft.contact.phone.trim(),
    },
    shipping: normalizedShipping(draft.shipping),
    lines: quote.lines,
    subtotalCents: quote.subtotalCents,
    shippingCents: quote.shippingCents,
    totalCents: quote.totalCents,
    paymentMethod: draft.paymentMethod as ShopOrder['paymentMethod'],
    fulfillment: 'placed',
    paidAt: null,
  };
  writeState({
    ...current,
    nextReference: current.nextReference + 1,
    products: adjustStock(current.products, quote.lines, -1),
    orders: [...current.orders, order],
  });
  return order;
}

/** A deleted account's orders stay in the book so they can ship and be accounted for, without the link to it. */
export function unlinkClientOrders(clientId: string): number {
  const current = readState();
  const linked = current.orders.filter((order) => order.clientId === clientId).length;
  writeState({
    ...current,
    orders: current.orders.map((order) =>
      order.clientId === clientId ? { ...order, clientId: null } : order,
    ),
  });
  return linked;
}

export function orderByReference(reference: string, actor: Actor | null): ShopOrder {
  const order = readState().orders.find((item) => item.reference === reference);
  if (!order || !canReadOrder(actor, order)) {
    throw new ShopRuleError('That order is not available.');
  }
  return order;
}

export function listOrders(actor: Actor | null): ShopOrder[] {
  return ordersVisibleTo(actor, readState().orders);
}

export function moveFulfillment(
  actor: Actor | null,
  reference: string,
  target: Fulfillment,
): ShopOrder {
  if (!canChangeFulfillment(actor)) {
    throw new ShopRuleError('Only shop staff can move an order.');
  }
  return changeFulfillment(requireOrder(reference), target);
}

/** The client who placed an order, or staff, can cancel it until it is completed. */
export function cancelOrder(actor: Actor | null, reference: string): ShopOrder {
  if (!actor) {
    throw new ShopRuleError('Sign in to cancel an order.');
  }
  const order = requireOrder(reference);
  if (!canCancelOrder(actor, order)) {
    throw new ShopRuleError('That order is not available.');
  }
  return changeFulfillment(order, 'cancelled');
}

/** An order paid by bank transfer, or null for any other reference. The caller has checked the link. */
export function transferOrder(reference: string): ShopOrder | null {
  const order = readState().orders.find((item) => item.reference === reference);
  return order?.paymentMethod === 'bank-transfer' ? order : null;
}

/** The transfer arrived. A second one changes nothing; a cancelled order takes no money. */
export function payTransfer(reference: string, paidAt = new Date().toISOString()): ShopOrder {
  const order = transferOrder(reference);
  if (!order) {
    throw new ShopRuleError('That order is not available.');
  }
  if (order.fulfillment === 'cancelled') {
    throw new ShopRuleError(`Order ${order.reference} was cancelled, so there is nothing to pay.`);
  }
  if (order.paidAt) {
    return order;
  }
  return replaceOrder({ ...order, paidAt });
}

/** A cancelled order's pieces go back on the floor, since nobody will take them. */
function changeFulfillment(order: ShopOrder, target: Fulfillment): ShopOrder {
  const updated = { ...order, fulfillment: transitionFulfillment(order.fulfillment, target) };
  if (target === 'cancelled') {
    const current = readState();
    writeState({ ...current, products: adjustStock(current.products, order.lines, 1) });
  }
  return replaceOrder(updated);
}

function replaceOrder(updated: ShopOrder): ShopOrder {
  const current = readState();
  writeState({
    ...current,
    orders: current.orders.map((item) => (item.reference === updated.reference ? updated : item)),
  });
  return updated;
}

function requireOrder(reference: string): ShopOrder {
  const order = readState().orders.find((item) => item.reference === reference);
  if (!order) {
    throw new ShopRuleError('That order is not available.');
  }
  return order;
}

export function setVariantStock(actor: Actor | null, variantId: string, stock: number): Product {
  if (!canChangeStock(actor)) {
    throw new ShopRuleError('Only shop staff can change stock.');
  }
  assertStock(stock);
  const product = productWithVariant(variantId);
  return replaceProduct({
    ...product,
    variants: product.variants.map((variant) =>
      variant.id === variantId ? { ...variant, stock } : variant,
    ),
  });
}

export function setProductPrice(
  actor: Actor | null,
  productId: string,
  priceCents: number,
): Product {
  if (!canChangePrice(actor)) {
    throw new ShopRuleError('Only the owner can change a price.');
  }
  assertPrice(priceCents);
  const product = requireProduct(productId);
  return replaceProduct({ ...product, priceCents });
}

export function createProduct(actor: Actor | null, piece: NewPiece): Product {
  if (!canAdministerCatalog(actor)) {
    throw new ShopRuleError('Only the owner can add a piece.');
  }
  if (!isCategorySlug(piece.category)) {
    throw new ShopRuleError('Choose a category from the floor.');
  }
  assertPrice(piece.priceCents);
  assertStock(piece.stock);
  const name = piece.name.trim();
  if (name.length < 2) {
    throw new ShopRuleError('Enter a name for the piece.');
  }
  const current = readState();
  const id = slug(`${name}-${current.products.length + 1}`);
  const product: Product = {
    id,
    name,
    category: piece.category,
    priceCents: piece.priceCents,
    summary: piece.summary.trim() || 'Added from the backoffice.',
    variants: [makeVariant(id, piece.size, piece.color, piece.stock)],
  };
  writeState({ ...current, products: [...current.products, product] });
  return product;
}

export function addVariant(actor: Actor | null, productId: string, variant: NewVariant): Product {
  if (!canAdministerCatalog(actor)) {
    throw new ShopRuleError('Only the owner can add a size or color.');
  }
  assertStock(variant.stock);
  const product = requireProduct(productId);
  const next = makeVariant(product.id, variant.size, variant.color, variant.stock);
  if (product.variants.some((item) => item.id === next.id)) {
    throw new ShopRuleError('That size and color already exist.');
  }
  return replaceProduct({ ...product, variants: [...product.variants, next] });
}

function freshState(): ShopState {
  return {
    products: cloneProducts(SEED_PRODUCTS),
    orders: [],
    nextReference: 1001,
  };
}

/** Takes an order's pieces off the floor (-1), or puts them back (1). */
function adjustStock(
  products: readonly Product[],
  lines: ShopOrder['lines'],
  direction: -1 | 1,
): Product[] {
  const change = new Map<string, number>();
  for (const line of lines) {
    change.set(line.variantId, (change.get(line.variantId) ?? 0) + direction * line.quantity);
  }
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const quantity = change.get(variant.id);
      return quantity === undefined ? variant : { ...variant, stock: variant.stock + quantity };
    }),
  }));
}

function requireProduct(productId: string): Product {
  const product = readState().products.find((item) => item.id === productId);
  if (!product) {
    throw new ShopRuleError('That piece is no longer on the floor.');
  }
  return product;
}

function productWithVariant(variantId: string): Product {
  const product = readState().products.find((item) =>
    item.variants.some((variant) => variant.id === variantId),
  );
  if (!product) {
    throw new ShopRuleError('That size is no longer on the floor.');
  }
  return product;
}

function replaceProduct(product: Product): Product {
  const current = readState();
  writeState({
    ...current,
    products: current.products.map((item) => (item.id === product.id ? product : item)),
  });
  return product;
}

function makeVariant(productId: string, size: string, color: string, stock: number): Variant {
  const sizeName = size.trim();
  const colorName = color.trim();
  if (sizeName.length === 0 || colorName.length === 0) {
    throw new ShopRuleError('Enter a size and a color.');
  }
  return {
    id: slug(`${productId}-${sizeName}-${colorName}`),
    size: sizeName,
    color: colorName,
    stock,
  };
}

function assertPrice(priceCents: number): void {
  if (!Number.isInteger(priceCents) || priceCents < 1) {
    throw new ShopRuleError('Enter a price in cents.');
  }
}

function assertStock(stock: number): void {
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ShopRuleError('Stock must be a whole number.');
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function categoryOf(value: string): CategorySlug | null {
  return isCategorySlug(value) ? value : null;
}
