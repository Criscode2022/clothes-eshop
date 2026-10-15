import { paymentLabel } from './checkout';
import type { ShopOrder } from './checkout';

/**
 * Marlow's account for bank transfers. It is fictional, like the bank the emailed link opens: this is
 * a demo shop, and no money moves. The IBAN carries a valid checksum so it reads like a real one.
 */
export const MARLOW_ACCOUNT = {
  name: 'Marlow Ready-to-Wear Ltd',
  iban: 'GB94 SNDB 2026 1015 0000 42',
  bic: 'SNDBGB2L',
} as const;

/** The simulated bank the emailed link opens. */
export const SANDBOX_BANK = 'Sandbox Bank';

export type PaymentState = 'pending' | 'paid';

/**
 * A bank transfer is pending until it arrives. The other methods are paid at the shop or on delivery,
 * so the shop tracks no state for them, and a cancelled order that was never paid owes nothing.
 */
export function paymentStateOf(
  order: Pick<ShopOrder, 'paymentMethod' | 'paidAt' | 'fulfillment'>,
): PaymentState | null {
  if (order.paymentMethod !== 'bank-transfer') {
    return null;
  }
  if (order.paidAt) {
    return 'paid';
  }
  return order.fulfillment === 'cancelled' ? null : 'pending';
}

/** How an order was paid, in one sentence for its page. */
export function paymentSummary(
  order: Pick<ShopOrder, 'paymentMethod' | 'paidAt' | 'fulfillment'>,
): string {
  const state = paymentStateOf(order);
  const method =
    state === 'pending'
      ? `${paymentLabel(order.paymentMethod)}, awaiting the transfer`
      : state === 'paid'
        ? `${paymentLabel(order.paymentMethod)}, paid`
        : paymentLabel(order.paymentMethod);
  return `${method}. No card was taken.`;
}

/** What the bank shows before the transfer: whom to pay, how much, and the reference to quote. */
export interface TransferDetails {
  readonly reference: string;
  readonly totalCents: number;
  readonly payee: string;
  readonly iban: string;
  readonly bic: string;
  readonly state: 'due' | 'paid' | 'cancelled';
}
