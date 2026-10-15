import { findProduct } from './catalog';
import type { Product } from './catalog';
import { ShopRuleError, StockLimitError } from './cart';
import type { CartLine } from './cart';
import { shippingFor } from './money';

export const PAYMENT_METHODS = [
  { id: 'shop-floor', label: 'Pay at the shop' },
  { id: 'bank-transfer', label: 'Bank transfer' },
  { id: 'cash-on-delivery', label: 'Cash when it arrives' },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export const FULFILLMENT_STATES = ['placed', 'picking', 'ready', 'completed', 'cancelled'] as const;
export type Fulfillment = (typeof FULFILLMENT_STATES)[number];

/** The way an order normally travels. Cancelling takes it off this track. */
const FULFILLMENT_TRACK = [
  'placed',
  'picking',
  'ready',
  'completed',
] as const satisfies readonly Fulfillment[];

export type TrackStatus = 'done' | 'current' | 'upcoming';

export interface TrackStep {
  readonly state: Fulfillment;
  readonly label: string;
  readonly status: TrackStatus;
}

const NEXT_FULFILLMENT: Record<Fulfillment, readonly Fulfillment[]> = {
  placed: ['picking', 'cancelled'],
  picking: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export interface ContactDetails {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

export interface ShippingDetails {
  readonly line1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface QuotedLine {
  readonly productId: string;
  readonly variantId: string;
  readonly name: string;
  readonly size: string;
  readonly color: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly lineCents: number;
}

export interface OrderQuote {
  readonly lines: readonly QuotedLine[];
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly totalCents: number;
}

export interface ShopOrder {
  readonly reference: string;
  readonly clientId: string | null;
  readonly contact: ContactDetails;
  readonly shipping: ShippingDetails;
  readonly lines: readonly QuotedLine[];
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly totalCents: number;
  readonly paymentMethod: PaymentMethodId;
  readonly fulfillment: Fulfillment;
}

export interface CheckoutDraft {
  readonly contact: ContactDetails;
  readonly shipping: ShippingDetails;
  readonly paymentMethod: string;
  readonly lines: readonly CartLine[];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARD_KEYS = ['cardnumber', 'card_number', 'pan', 'cvv', 'cvc', 'securitycode'];

export function paymentLabel(method: string): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.label ?? method;
}

export function quoteOrder(lines: readonly CartLine[], products: readonly Product[]): OrderQuote {
  if (lines.length === 0) {
    throw new ShopRuleError('The bag is empty.');
  }
  const quoted: QuotedLine[] = lines.map((line) => quoteLine(line, products));
  const subtotalCents = quoted.reduce((sum, line) => sum + line.lineCents, 0);
  const shippingCents = shippingFor(subtotalCents);
  return {
    lines: quoted,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

export function assertCheckoutDraft(
  draft: CheckoutDraft,
  products: readonly Product[],
): OrderQuote {
  assertNoCardData(draft);
  assertContact(draft.contact);
  assertShipping(draft.shipping);
  assertPaymentMethod(draft.paymentMethod);
  return quoteOrder(draft.lines, products);
}

export function assertPaymentMethod(method: string): asserts method is PaymentMethodId {
  if (!PAYMENT_METHODS.some((item) => item.id === method)) {
    throw new ShopRuleError('Choose how you will pay.');
  }
}

/** An order can be cancelled until it is completed. */
export function canBeCancelled(state: Fulfillment): boolean {
  return NEXT_FULFILLMENT[state].includes('cancelled');
}

export function transitionFulfillment(current: Fulfillment, target: Fulfillment): Fulfillment {
  if (!NEXT_FULFILLMENT[current].includes(target)) {
    throw new ShopRuleError(`An order that is ${current} cannot move to ${target}.`);
  }
  return target;
}

const FULFILLMENT_NAMES: Record<Fulfillment, string> = {
  placed: 'Placed',
  picking: 'Picking',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** The verb on the button that moves an order into each state. */
const FULFILLMENT_ACTIONS: Record<Fulfillment, string> = {
  placed: 'Placed',
  picking: 'Start picking',
  ready: 'Mark ready',
  completed: 'Complete',
  cancelled: 'Cancel',
};

export function fulfillmentName(state: Fulfillment): string {
  return FULFILLMENT_NAMES[state];
}

export function fulfillmentActions(
  current: Fulfillment,
): readonly { target: Fulfillment; label: string }[] {
  return NEXT_FULFILLMENT[current].map((target) => ({
    target,
    label: FULFILLMENT_ACTIONS[target],
  }));
}

/** Each step of the track, marked behind, at, or ahead of the order. A cancelled order has no track. */
export function fulfillmentTrack(current: Fulfillment): TrackStep[] {
  const position = FULFILLMENT_TRACK.findIndex((state) => state === current);
  if (position < 0) {
    return [];
  }
  return FULFILLMENT_TRACK.map((state, index) => ({
    state,
    label: fulfillmentName(state),
    status: trackStatus(index, position),
  }));
}

function trackStatus(index: number, position: number): TrackStatus {
  if (index < position) {
    return 'done';
  }
  return index === position ? 'current' : 'upcoming';
}

export function assertNoCardData(value: unknown): void {
  if (containsCardData(value)) {
    throw new ShopRuleError('Card numbers are not accepted. Choose a payment method instead.');
  }
}

function quoteLine(line: CartLine, products: readonly Product[]): QuotedLine {
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new ShopRuleError('Quantity must be a whole number above zero.');
  }
  const product = findProduct(products, line.productId);
  if (!product) {
    throw new ShopRuleError('That piece is no longer on the floor.');
  }
  const variant = product.variants.find((item) => item.id === line.variantId);
  if (!variant) {
    throw new ShopRuleError('That size is no longer on the floor.');
  }
  if (line.quantity > variant.stock) {
    throw new StockLimitError(variant.stock);
  }
  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    size: variant.size,
    color: variant.color,
    quantity: line.quantity,
    unitPriceCents: product.priceCents,
    lineCents: product.priceCents * line.quantity,
  };
}

function assertContact(contact: ContactDetails): void {
  if (contact.name.trim().length < 2) {
    throw new ShopRuleError('Enter the name for the parcel.');
  }
  if (!EMAIL.test(contact.email.trim())) {
    throw new ShopRuleError('Enter an email for the receipt.');
  }
  if (contact.phone.trim().length < 7) {
    throw new ShopRuleError('Enter a phone number.');
  }
}

function assertShipping(shipping: ShippingDetails): void {
  if (shipping.line1.trim().length < 3) {
    throw new ShopRuleError('Enter the street.');
  }
  if (shipping.city.trim().length < 2) {
    throw new ShopRuleError('Enter the city.');
  }
  if (shipping.postalCode.trim().length < 3) {
    throw new ShopRuleError('Enter the postal code.');
  }
  if (shipping.country.trim().length < 2) {
    throw new ShopRuleError('Enter the country.');
  }
}

function containsCardData(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (CARD_KEYS.includes(key.toLowerCase().replace(/[^a-z_]/g, ''))) {
      return true;
    }
    if (containsCardData(nested)) {
      return true;
    }
  }
  return false;
}
