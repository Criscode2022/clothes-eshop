/** Prices are integer cents so totals do not drift. Shipping is $8, and free from $200. */
export const SHIPPING_CENTS = 800;
export const FREE_SHIPPING_FROM_CENTS = 20_000;

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = (absolute % 100).toString().padStart(2, '0');
  return `${sign}$${dollars}.${remainder}`;
}

export function shippingFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;
}

/** Cents still needed before shipping drops to zero. */
export function centsUntilFreeShipping(subtotalCents: number): number {
  return Math.max(0, FREE_SHIPPING_FROM_CENTS - subtotalCents);
}

/** How far the pieces have filled toward free shipping, from 0 to 1. */
export function freeShippingProgress(subtotalCents: number): number {
  return Math.min(1, Math.max(0, subtotalCents) / FREE_SHIPPING_FROM_CENTS);
}

/** The owner types prices in dollars; the shop stores whole cents. */
export function centsFromDollars(dollars: number): number {
  return Math.round(dollars * 100);
}

export function dollarsFromCents(cents: number): number {
  return cents / 100;
}
