import type { Actor, ShopRole } from './access';
import { ShopRuleError, StockLimitError } from './cart';
import type { CartLine } from './cart';
import type { ContactDetails, Fulfillment, ShippingDetails } from './checkout';
import { FULFILLMENT_STATES } from './checkout';
import {
  addVariant,
  createProduct,
  listCatalog,
  listOrders,
  moveFulfillment,
  orderByReference,
  placeOrder,
  resetShop,
  setProductPrice,
  setVariantStock,
} from './order-book';
import type { NewPiece, NewVariant } from './order-book';
import { accountKindOf, newSessionToken } from './session-tokens';
import type { AccountKind } from './session-tokens';

/**
 * Floor accounts for the shop before Neon Auth is configured.
 * The password is a demo floor password, not a provider token.
 * Roles are assigned here on the server. The browser cannot pick its own role.
 */
const FLOOR_PASSWORD = 'marlow-floor';

const FLOOR_ACCOUNTS: readonly (Actor & { readonly password: string })[] = [
  {
    id: '8a1c1a10-0000-4000-8000-000000000001',
    role: 'client',
    name: 'Avery Cole',
    email: 'avery@marlow.shop',
    password: FLOOR_PASSWORD,
  },
  {
    id: '8a1c1a10-0000-4000-8000-000000000002',
    role: 'client',
    name: 'Noah Pell',
    email: 'noah@marlow.shop',
    password: FLOOR_PASSWORD,
  },
  {
    id: '8a1c1a10-0000-4000-8000-000000000003',
    role: 'worker',
    name: 'Jordan Hale',
    email: 'jordan@marlow.shop',
    password: FLOOR_PASSWORD,
  },
  {
    id: '8a1c1a10-0000-4000-8000-000000000004',
    role: 'owner',
    name: 'Sloan Marlow',
    email: 'sloan@marlow.shop',
    password: FLOOR_PASSWORD,
  },
];

export const FLOOR_PASSWORD_HINT = FLOOR_PASSWORD;

const sessions = new Map<string, Actor>();

export interface ShopHttpResult {
  readonly status: number;
  readonly body: unknown;
}

export function resetShopServer(): void {
  resetShop();
  sessions.clear();
}

/**
 * Records guest and signed-in orders, payment methods, and staff changes.
 * Anonymous callers never receive a write on the database; this process does the write.
 */
export function handleShopHttp(
  method: string,
  path: string,
  body: unknown,
  authorization: string | null,
): ShopHttpResult {
  try {
    return dispatch(method.toUpperCase(), path, body, authorization);
  } catch (error) {
    return failure(error);
  }
}

function dispatch(
  method: string,
  path: string,
  body: unknown,
  authorization: string | null,
): ShopHttpResult {
  const actor = actorFrom(authorization);
  if (method === 'POST' && path === '/api/session') {
    return signIn(body);
  }
  if (method === 'DELETE' && path === '/api/session') {
    const token = tokenFrom(authorization);
    if (token) {
      sessions.delete(token);
    }
    return { status: 200, body: { signedOut: true } };
  }
  if (method === 'GET' && path === '/api/catalog') {
    return { status: 200, body: listCatalog() };
  }
  if (method === 'POST' && path === '/api/orders') {
    const draft = parseDraft(body);
    const order = placeOrder(draft, actor, body);
    return { status: 201, body: order };
  }
  if (method === 'GET' && path === '/api/orders') {
    if (!actor) {
      throw new ShopRuleError('Sign in to see orders.');
    }
    return { status: 200, body: listOrders(actor) };
  }

  const fulfillment = path.match(/^\/api\/orders\/([^/]+)\/fulfillment$/);
  if (method === 'POST' && fulfillment) {
    return {
      status: 200,
      body: moveFulfillment(actor, decode(fulfillment[1]), parseFulfillment(body)),
    };
  }

  const orderPath = path.match(/^\/api\/orders\/([^/]+)$/);
  if (method === 'GET' && orderPath) {
    return { status: 200, body: orderByReference(decode(orderPath[1]), actor) };
  }

  const stockPath = path.match(/^\/api\/variants\/([^/]+)\/stock$/);
  if (method === 'POST' && stockPath) {
    return { status: 200, body: setVariantStock(actor, decode(stockPath[1]), parseStock(body)) };
  }

  const pricePath = path.match(/^\/api\/products\/([^/]+)\/price$/);
  if (method === 'POST' && pricePath) {
    return { status: 200, body: setProductPrice(actor, decode(pricePath[1]), parsePrice(body)) };
  }

  const variantPath = path.match(/^\/api\/products\/([^/]+)\/variants$/);
  if (method === 'POST' && variantPath) {
    return { status: 201, body: addVariant(actor, decode(variantPath[1]), parseVariant(body)) };
  }

  if (method === 'POST' && path === '/api/products') {
    return { status: 201, body: createProduct(actor, parsePiece(body)) };
  }

  return { status: 404, body: { message: 'That shop route does not exist.' } };
}

/** Opens a server session for an actor the database already accepted. The browser does not choose the role. */
export function openSession(actor: Actor): { token: string; actor: Actor } {
  const token = newSessionToken('neon');
  sessions.set(token, actor);
  return { token, actor };
}

/** The person behind a request and the kind of account they signed in with, or null without a session. */
export function sessionOf(
  authorization: string | null,
): { readonly actor: Actor; readonly kind: AccountKind } | null {
  const token = tokenFrom(authorization);
  const actor = token ? sessions.get(token) : undefined;
  const kind = token ? accountKindOf(token) : null;
  return actor && kind ? { actor, kind } : null;
}

/** Every open session of one account shows its new name at once. */
export function renameSessionsOf(actorId: string, name: string): Actor | null {
  let renamed: Actor | null = null;
  for (const [token, actor] of sessions) {
    if (actor.id === actorId) {
      renamed = { ...actor, name };
      sessions.set(token, renamed);
    }
  }
  return renamed;
}

/** Signs an account out everywhere, as when it is deleted. */
export function endSessionsOf(actorId: string): void {
  for (const [token, actor] of sessions) {
    if (actor.id === actorId) {
      sessions.delete(token);
    }
  }
}

function signIn(body: unknown): ShopHttpResult {
  const record = asRecord(body);
  const email = readString(record, 'email').toLowerCase();
  const password = readString(record, 'password');
  const account = FLOOR_ACCOUNTS.find((item) => item.email === email && item.password === password);
  if (!account) {
    return {
      status: 401,
      body: { message: 'That email and password do not match a floor account.' },
    };
  }
  const actor: Actor = {
    id: account.id,
    role: account.role,
    name: account.name,
    email: account.email,
  };
  const token = newSessionToken('floor');
  sessions.set(token, actor);
  return { status: 200, body: { token, actor } };
}

function actorFrom(authorization: string | null): Actor | null {
  return sessionOf(authorization)?.actor ?? null;
}

function tokenFrom(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function parseDraft(body: unknown): {
  contact: ContactDetails;
  shipping: ShippingDetails;
  paymentMethod: string;
  lines: CartLine[];
} {
  const record = asRecord(body);
  const contact = asRecord(record['contact']);
  const shipping = asRecord(record['shipping']);
  const lines = record['lines'];
  if (!Array.isArray(lines)) {
    throw new ShopRuleError('Add a piece before checkout.');
  }
  return {
    contact: {
      name: readString(contact, 'name'),
      email: readString(contact, 'email'),
      phone: readString(contact, 'phone'),
    },
    shipping: {
      line1: readString(shipping, 'line1'),
      city: readString(shipping, 'city'),
      postalCode: readString(shipping, 'postalCode'),
      country: readString(shipping, 'country'),
    },
    paymentMethod: readString(record, 'paymentMethod'),
    lines: lines.map((line) => {
      const item = asRecord(line);
      return {
        productId: readString(item, 'productId'),
        variantId: readString(item, 'variantId'),
        quantity: readInteger(item, 'quantity'),
      };
    }),
  };
}

function parseFulfillment(body: unknown): Fulfillment {
  const value = readString(asRecord(body), 'fulfillment');
  if (!FULFILLMENT_STATES.some((state) => state === value)) {
    throw new ShopRuleError('That fulfillment state does not exist.');
  }
  return value as Fulfillment;
}

function parseStock(body: unknown): number {
  return readInteger(asRecord(body), 'stock');
}

function parsePrice(body: unknown): number {
  return readInteger(asRecord(body), 'priceCents');
}

function parseVariant(body: unknown): NewVariant {
  const record = asRecord(body);
  return {
    size: readString(record, 'size'),
    color: readString(record, 'color'),
    stock: readInteger(record, 'stock'),
  };
}

function parsePiece(body: unknown): NewPiece {
  const record = asRecord(body);
  return {
    name: readString(record, 'name'),
    category: readString(record, 'category'),
    priceCents: readInteger(record, 'priceCents'),
    summary: readString(record, 'summary'),
    size: readString(record, 'size'),
    color: readString(record, 'color'),
    stock: readInteger(record, 'stock'),
  };
}

function failure(error: unknown): ShopHttpResult {
  if (error instanceof StockLimitError || error instanceof ShopRuleError) {
    const status = /only the owner|only shop staff|sign in/i.test(error.message) ? 403 : 400;
    return { status, body: { message: error.message } };
  }
  return { status: 500, body: { message: 'The shop could not finish that.' } };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ShopRuleError('The shop could not read that request.');
  }
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new ShopRuleError(`Enter ${key}.`);
  }
  return value;
}

function readInteger(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ShopRuleError(`Enter ${key}.`);
  }
  return value;
}

function decode(value: string): string {
  return decodeURIComponent(value);
}

export function floorRole(email: string): ShopRole | null {
  return FLOOR_ACCOUNTS.find((account) => account.email === email)?.role ?? null;
}
