import type { Locale } from '../i18n/locale';
import { findProduct } from './catalog';
import type { Product } from './catalog';
import { ShopRuleError, StockLimitError } from './cart';
import type { CartLine } from './cart';
import type { Fulfillment } from './fulfillment';
import { shippingFor } from './money';

/** How an order reaches the client: sent to an address, or picked up at the shop's counter. */
export const DELIVERY_METHODS = [
  { id: 'ship', label: 'Ship to an address', short: 'Ship' },
  { id: 'pickup', label: 'Pick up at the shop', short: 'Pick up' },
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]['id'];

/** Each way to pay, and the deliveries it fits: paying at the shop needs the client there. */
export const PAYMENT_METHODS = [
  { id: 'shop-floor', label: 'Pay at the shop', delivery: ['pickup'] },
  { id: 'bank-transfer', label: 'Bank transfer', delivery: ['ship', 'pickup'] },
  { id: 'cash-on-delivery', label: 'Cash when it arrives', delivery: ['ship'] },
] as const satisfies readonly {
  id: string;
  label: string;
  delivery: readonly DeliveryMethod[];
}[];

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The orders a payment method is for, as its refusal names them. */
const DELIVERY_PHRASES: Record<DeliveryMethod, string> = {
  ship: 'shipped to an address',
  pickup: 'picked up at the shop',
};

export interface ContactDetails {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

export interface ShippingDetails {
  readonly line1: string;
  readonly city: string;
  /** The state, province, or prefecture, where the country's addresses name one; '' elsewhere. */
  readonly region: string;
  /** '' where the country has no postal codes. */
  readonly postalCode: string;
  /** The country's English name, from the list Marlow ships to. */
  readonly country: string;
}

/** The address under the name, as the order page, the desk, and the email print it. */
export function addressLines(shipping: ShippingDetails): string[] {
  const place = shipping.region ? `${shipping.city}, ${shipping.region}` : shipping.city;
  return [shipping.line1, [place, shipping.postalCode].filter(Boolean).join(' '), shipping.country];
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
  readonly delivery: DeliveryMethod;
  /** Where the order ships; null for an order picked up at the shop. */
  readonly shipping: ShippingDetails | null;
  readonly lines: readonly QuotedLine[];
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly totalCents: number;
  readonly paymentMethod: PaymentMethodId;
  readonly fulfillment: Fulfillment;
  /** When a bank transfer arrived (ISO time); null until then, and for the methods paid in person. */
  readonly paidAt: string | null;
  /** When the order was placed (ISO time). */
  readonly placedAt: string;
  /** The language of the checkout that placed it. Orders from before this was stored are English. */
  readonly locale?: Locale;
}

/** An order as the browser sends it: the server checks every field before trusting it. */
export interface CheckoutDraft {
  readonly contact: ContactDetails;
  readonly delivery: string;
  /** Read only when the order ships. */
  readonly shipping: ShippingDetails | null;
  readonly paymentMethod: string;
  readonly lines: readonly CartLine[];
  /** The language the checkout was showing. Absent means English. */
  readonly locale?: string;
}

const CARD_KEYS = ['cardnumber', 'card_number', 'pan', 'cvv', 'cvc', 'securitycode'];

export function paymentLabel(method: string): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.label ?? method;
}

export function deliveryLabel(delivery: DeliveryMethod): string {
  return DELIVERY_METHODS.find((item) => item.id === delivery)?.label ?? delivery;
}

/** The ways to pay an order that reaches the client this way, in the order checkout offers them. */
export function paymentMethodsFor(delivery: DeliveryMethod): PaymentMethod[] {
  return PAYMENT_METHODS.filter((method) => fitsDelivery(method, delivery));
}

export function paymentFitsDelivery(method: string, delivery: DeliveryMethod): boolean {
  return paymentMethodsFor(delivery).some((item) => item.id === method);
}

/** Shipping costs only an order that ships; picking up at the shop is free. */
export function shippingCentsFor(delivery: DeliveryMethod, subtotalCents: number): number {
  return delivery === 'pickup' ? 0 : shippingFor(subtotalCents);
}

export function quoteOrder(
  lines: readonly CartLine[],
  products: readonly Product[],
  delivery: DeliveryMethod,
): OrderQuote {
  if (lines.length === 0) {
    throw new ShopRuleError('The bag is empty.');
  }
  const quoted: QuotedLine[] = lines.map((line) => quoteLine(line, products));
  const subtotalCents = quoted.reduce((sum, line) => sum + line.lineCents, 0);
  const shippingCents = shippingCentsFor(delivery, subtotalCents);
  return {
    lines: quoted,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

/** A draft the shop accepts: how it reaches the client, how it is paid, and what it costs. */
export interface AcceptedDraft extends OrderQuote {
  readonly delivery: DeliveryMethod;
  readonly paymentMethod: PaymentMethodId;
}

export function assertCheckoutDraft(
  draft: CheckoutDraft,
  products: readonly Product[],
): AcceptedDraft {
  assertNoCardData(draft);
  const { delivery, paymentMethod } = draft;
  assertDeliveryMethod(delivery);
  assertPaymentMethod(paymentMethod, delivery);
  return { ...quoteOrder(draft.lines, products, delivery), delivery, paymentMethod };
}

export function assertDeliveryMethod(delivery: string): asserts delivery is DeliveryMethod {
  if (!DELIVERY_METHODS.some((item) => item.id === delivery)) {
    throw new ShopRuleError('Choose how the order reaches you.');
  }
}

export function assertPaymentMethod(
  method: string,
  delivery: DeliveryMethod,
): asserts method is PaymentMethodId {
  const known = PAYMENT_METHODS.find((item) => item.id === method);
  if (!known) {
    throw new ShopRuleError('Choose how you will pay.');
  }
  if (!fitsDelivery(known, delivery)) {
    const fits = known.delivery.map((item) => DELIVERY_PHRASES[item]).join(' or ');
    throw new ShopRuleError(`${known.label} is only for orders ${fits}.`);
  }
}

function fitsDelivery(method: PaymentMethod, delivery: DeliveryMethod): boolean {
  return (method.delivery as readonly DeliveryMethod[]).includes(delivery);
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
