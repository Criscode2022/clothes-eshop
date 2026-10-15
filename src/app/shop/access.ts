import type { ShopOrder } from './checkout';

export type ShopRole = 'client' | 'worker' | 'owner';

export interface Actor {
  readonly id: string;
  readonly role: ShopRole;
  readonly name: string;
  readonly email: string;
}

export type StaffArea = 'desk' | 'owner';

/** Staff areas are closed to visitors and clients. Only the owner opens the backoffice. */
export function canOpenArea(area: StaffArea, actor: Actor | null): boolean {
  if (actor?.role === 'owner') {
    return true;
  }
  return area === 'desk' && actor?.role === 'worker';
}

export function canChangePrice(actor: Actor | null): boolean {
  return actor?.role === 'owner';
}

export function canChangeStock(actor: Actor | null): boolean {
  return actor?.role === 'worker' || actor?.role === 'owner';
}

export function canChangeFulfillment(actor: Actor | null): boolean {
  return actor?.role === 'worker' || actor?.role === 'owner';
}

/** Staff can cancel any order; a client only an order stored with that client's id. */
export function canCancelOrder(actor: Actor | null, order: ShopOrder): boolean {
  if (canChangeFulfillment(actor)) {
    return true;
  }
  return actor?.role === 'client' && order.clientId === actor.id;
}

export function canAdministerCatalog(actor: Actor | null): boolean {
  return actor?.role === 'owner';
}

/** A client sees only orders stored with that client's id. Staff see the whole book. */
export function ordersVisibleTo(actor: Actor | null, orders: readonly ShopOrder[]): ShopOrder[] {
  if (!actor) {
    return [];
  }
  if (actor.role === 'client') {
    return orders.filter((order) => order.clientId === actor.id);
  }
  return [...orders];
}

export function canReadOrder(actor: Actor | null, order: ShopOrder): boolean {
  if (actor?.role === 'worker' || actor?.role === 'owner') {
    return true;
  }
  if (actor?.role === 'client') {
    return order.clientId === actor.id;
  }
  return order.clientId === null;
}
