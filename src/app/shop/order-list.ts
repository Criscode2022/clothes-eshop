import type { ShopOrder } from './checkout';

export type OrderSort = 'date' | 'price';
export type SortDirection = 'asc' | 'desc';

/** What the client's order list shows, as its address names it: `?reference=…&sort=price&dir=asc`. */
export interface OrderListView {
  /** Any part of a reference; '' lists every order. */
  readonly reference: string;
  readonly sort: OrderSort;
  readonly dir: SortDirection;
}

/** The query parameters as the address gives them; any of them may be missing or nonsense. */
export interface OrderListQuery {
  readonly reference?: string;
  readonly sort?: string;
  readonly dir?: string;
}

/** The ways to order the list, as the Sort select offers them. The first is the default. */
export const ORDER_SORTS = [
  { id: 'date-desc', sort: 'date', dir: 'desc', label: 'Newest first' },
  { id: 'date-asc', sort: 'date', dir: 'asc', label: 'Oldest first' },
  { id: 'price-desc', sort: 'price', dir: 'desc', label: 'Price, high to low' },
  { id: 'price-asc', sort: 'price', dir: 'asc', label: 'Price, low to high' },
] as const satisfies readonly (Omit<OrderListView, 'reference'> & {
  id: string;
  label: string;
})[];

const DEFAULT_VIEW: OrderListView = { reference: '', sort: 'date', dir: 'desc' };

export function orderListView(query: OrderListQuery): OrderListView {
  return {
    reference: query.reference?.trim() ?? '',
    sort: query.sort === 'price' || query.sort === 'date' ? query.sort : DEFAULT_VIEW.sort,
    dir: query.dir === 'asc' || query.dir === 'desc' ? query.dir : DEFAULT_VIEW.dir,
  };
}

/** The query parameters for a view: only what differs from the default, so a plain list has none. */
export function orderListParams(view: OrderListView): Record<string, string> {
  const reference = view.reference.trim();
  const sorted = view.sort !== DEFAULT_VIEW.sort || view.dir !== DEFAULT_VIEW.dir;
  return {
    ...(reference ? { reference } : {}),
    ...(sorted ? { sort: view.sort, dir: view.dir } : {}),
  };
}

/** The orders the view asks for, in its order; equal prices fall back to the newest first. */
export function listedOrders(orders: readonly ShopOrder[], view: OrderListView): ShopOrder[] {
  const wanted = compact(view.reference);
  const sign = view.dir === 'asc' ? 1 : -1;
  return orders
    .filter((order) => compact(order.reference).includes(wanted))
    .sort((left, right) => {
      const primary =
        view.sort === 'price' ? left.totalCents - right.totalCents : byDate(left, right);
      return primary !== 0 ? sign * primary : byDate(right, left);
    });
}

/** By when it was placed; references run in sequence, so they settle orders placed in the same instant. */
function byDate(left: ShopOrder, right: ShopOrder): number {
  return (
    left.placedAt.localeCompare(right.placedAt) || referenceNumber(left) - referenceNumber(right)
  );
}

function referenceNumber(order: ShopOrder): number {
  return Number(order.reference.replace(/\D/g, '')) || 0;
}

/** A reference without case, spaces, or dashes, so "mr1003" finds MR-1003. */
function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
