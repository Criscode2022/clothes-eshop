import type { Locale } from '../i18n/locale';
import { translate } from '../i18n/translate';
import type { CopyParams } from '../i18n/translate';
import { ShopRuleError } from './cart';
import type { DeliveryMethod, ShopOrder } from './checkout';

export const FULFILLMENT_STATES = [
  'placed',
  'preparing',
  'shipped',
  'ready',
  'delivered',
  'picked-up',
  'cancelled',
] as const;
export type Fulfillment = (typeof FULFILLMENT_STATES)[number];

/** How an order travels, by how it reaches the client. Cancelling takes it off its track. */
const TRACKS: Record<DeliveryMethod, readonly Fulfillment[]> = {
  ship: ['placed', 'preparing', 'shipped', 'delivered'],
  pickup: ['placed', 'preparing', 'ready', 'picked-up'],
};

/** Until it leaves the shop, or until it is picked up: a parcel on its way is with the carrier. */
const CANCELLABLE: readonly Fulfillment[] = ['placed', 'preparing', 'ready'];

const NAMES: Record<Fulfillment, string> = {
  placed: 'Order placed',
  preparing: 'Being prepared',
  shipped: 'On its way',
  ready: 'Ready to pick up',
  delivered: 'Delivered',
  'picked-up': 'Picked up',
  cancelled: 'Cancelled',
};

/** The words on the desk's button that moves an order into each state. */
const ACTIONS: Record<Fulfillment, string> = {
  placed: 'Placed',
  preparing: 'Start preparing',
  shipped: 'Mark shipped',
  ready: 'Mark ready to pick up',
  delivered: 'Mark delivered',
  'picked-up': 'Mark picked up',
  cancelled: 'Cancel',
};

/** What an order's track needs to know. */
export type TrackedOrder = Pick<ShopOrder, 'delivery' | 'fulfillment'>;

/** What the sentence under the track needs to know. */
export type NotedOrder = Pick<
  ShopOrder,
  'delivery' | 'fulfillment' | 'shipping' | 'reference' | 'paymentMethod'
>;

export type TrackStatus = 'done' | 'current' | 'upcoming';

export interface TrackStep {
  readonly state: Fulfillment;
  readonly label: string;
  readonly status: TrackStatus;
}

export function fulfillmentName(state: Fulfillment): string {
  return NAMES[state];
}

/** The states an order can move to next: one step along its track, or cancelled while that is allowed. */
function nextStates(order: TrackedOrder): Fulfillment[] {
  const track = TRACKS[order.delivery];
  const position = track.indexOf(order.fulfillment);
  if (position < 0) {
    return [];
  }
  const forward = track.slice(position + 1, position + 2);
  return canBeCancelled(order) ? [...forward, 'cancelled'] : forward;
}

export function canBeCancelled(order: TrackedOrder): boolean {
  return CANCELLABLE.includes(order.fulfillment);
}

export function transitionFulfillment(order: TrackedOrder, target: Fulfillment): Fulfillment {
  if (nextStates(order).includes(target)) {
    return target;
  }
  if (order.fulfillment === 'cancelled') {
    throw new ShopRuleError('This order is already cancelled.');
  }
  if (target === 'cancelled') {
    throw new ShopRuleError(
      `An order that is ${fulfillmentName(order.fulfillment).toLowerCase()} can no longer be cancelled.`,
    );
  }
  throw new ShopRuleError(
    `This order cannot go from “${fulfillmentName(order.fulfillment)}” to “${fulfillmentName(target)}”.`,
  );
}

export function fulfillmentActions(
  order: TrackedOrder,
): readonly { target: Fulfillment; label: string }[] {
  return nextStates(order).map((target) => ({ target, label: ACTIONS[target] }));
}

/** Each step of the order's track, marked behind, at, or ahead of it. A cancelled order has no track. */
export function fulfillmentTrack(order: TrackedOrder): TrackStep[] {
  const track = TRACKS[order.delivery];
  const position = track.indexOf(order.fulfillment);
  if (position < 0) {
    return [];
  }
  return track.map((state, index) => ({
    state,
    label: fulfillmentName(state),
    status: trackStatus(index, position),
  }));
}

/** Where the order is, in a sentence the client reads under the track. English when no language is given. */
export function fulfillmentNote(order: NotedOrder, locale: Locale = 'en'): string {
  const t = (english: string, params?: CopyParams): string => translate(locale, english, params);
  switch (order.fulfillment) {
    case 'placed':
      return t('We have your order and will start preparing it soon.');
    case 'preparing':
      return order.delivery === 'pickup'
        ? t('We are gathering your pieces and setting them aside at the counter.')
        : t('We are gathering your pieces and packing them in the workroom.');
    case 'shipped':
      return t('Your parcel has left the shop for {city}.', {
        city: order.shipping?.city ?? t('you'),
      });
    case 'delivered':
      return order.shipping
        ? t('Your parcel was delivered to {line1}, {city}.', {
            line1: order.shipping.line1,
            city: order.shipping.city,
          })
        : t('Your parcel was delivered.');
    case 'ready':
      return order.paymentMethod === 'shop-floor'
        ? t(
            'Your pieces are waiting at the counter. Give the reference {reference} when you come, and pay there.',
            { reference: order.reference },
          )
        : t(
            'Your pieces are waiting at the counter. Give the reference {reference} when you come.',
            { reference: order.reference },
          );
    case 'picked-up':
      return t('You picked up this order at the shop.');
    case 'cancelled':
      return t('This order was cancelled, and its pieces went back on the floor.');
  }
}

function trackStatus(index: number, position: number): TrackStatus {
  if (index < position) {
    return 'done';
  }
  return index === position ? 'current' : 'upcoming';
}
