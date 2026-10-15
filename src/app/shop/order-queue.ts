import type { ShopOrder } from './checkout';
import { FULFILLMENT_STATES, fulfillmentName } from './fulfillment';
import type { Fulfillment } from './fulfillment';

/** One view of the desk's order list: every open order, or one fulfillment state. */
export type QueueView = 'open' | Fulfillment;

/** Orders the shop still has work on: a parcel on its way still needs marking delivered. */
const OPEN_STATES: readonly Fulfillment[] = ['placed', 'preparing', 'shipped', 'ready'];

export const QUEUE_VIEWS: readonly { readonly id: QueueView; readonly label: string }[] = [
  { id: 'open', label: 'Open' },
  ...FULFILLMENT_STATES.map((state) => ({ id: state, label: fulfillmentName(state) })),
];

export function queueCounts(orders: readonly ShopOrder[]): Record<QueueView, number> {
  const counts = Object.fromEntries(QUEUE_VIEWS.map((view) => [view.id, 0])) as Record<
    QueueView,
    number
  >;
  for (const order of orders) {
    counts[order.fulfillment] += 1;
    if (isOpen(order)) {
      counts.open += 1;
    }
  }
  return counts;
}

/** The orders in one view, newest first, narrowed to a reference or client name when a query is typed. */
export function ordersInView(
  orders: readonly ShopOrder[],
  view: QueueView,
  query: string,
): ShopOrder[] {
  const needle = query.trim().toLowerCase();
  return orders.filter((order) => inView(order, view) && matches(order, needle)).sort(newestFirst);
}

function inView(order: ShopOrder, view: QueueView): boolean {
  return view === 'open' ? isOpen(order) : order.fulfillment === view;
}

function isOpen(order: ShopOrder): boolean {
  return OPEN_STATES.includes(order.fulfillment);
}

function matches(order: ShopOrder, needle: string): boolean {
  return (
    needle.length === 0 ||
    order.reference.toLowerCase().includes(needle) ||
    order.contact.name.toLowerCase().includes(needle)
  );
}

function newestFirst(left: ShopOrder, right: ShopOrder): number {
  return referenceNumber(right) - referenceNumber(left);
}

function referenceNumber(order: ShopOrder): number {
  return Number(order.reference.replace(/\D/g, '')) || 0;
}
