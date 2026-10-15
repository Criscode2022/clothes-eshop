import type { Actor } from './access';
import { MARLOW_ACCOUNT } from './bank-transfer';
import type { TransferDetails } from './bank-transfer';
import { ShopRuleError, StockLimitError } from './cart';
import type { CheckoutDraft, ShippingDetails, ShopOrder } from './checkout';
import { FULFILLMENT_STATES } from './fulfillment';
import type { Fulfillment } from './fulfillment';
import {
  addVariant,
  cancelOrder,
  createProduct,
  listCatalog,
  listOrders,
  moveFulfillment,
  orderByReference,
  payTransfer,
  placeOrder,
  resetShop,
  setProductPrice,
  setVariantStock,
  transferOrder,
} from './order-book';
import type { NewPiece, NewVariant } from './order-book';
import { SessionSeal, sessionKeyFrom } from './session-seal';
import { TransferCodes, transferKeyFrom } from './transfer-codes';

/** Signs with random keys until the server hands it the secret every process shares. */
let seal = new SessionSeal(sessionKeyFrom(undefined));
let transferCodes = new TransferCodes(transferKeyFrom(undefined));

/** Sessions and transfer links signed from the same secret are good on every process that has it. */
export function signWithSecret(secret: string | undefined): void {
  seal = new SessionSeal(sessionKeyFrom(secret));
  transferCodes = new TransferCodes(transferKeyFrom(secret));
}

export interface ShopHttpResult {
  readonly status: number;
  readonly body: unknown;
}

export function resetShopServer(): void {
  resetShop();
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
  const actor = actorOf(authorization);
  if (method === 'GET' && path === '/api/session') {
    return savedSession(authorization);
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

  const cancelPath = path.match(/^\/api\/orders\/([^/]+)\/cancel$/);
  if (method === 'POST' && cancelPath) {
    return { status: 200, body: cancelOrder(actor, decode(cancelPath[1])) };
  }

  const transferPath = path.match(/^\/api\/transfers\/([^/]+)\/([^/]+)$/);
  if (transferPath && (method === 'GET' || method === 'POST')) {
    return transfer(method, decode(transferPath[1]), decode(transferPath[2]));
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

/**
 * Where the simulated bank pays a bank transfer order: `/bank/<reference>/<code>`, signed so that only
 * the order's email carries it. Null for the methods paid in person.
 */
export function transferPathOf(order: ShopOrder): string | null {
  if (order.paymentMethod !== 'bank-transfer') {
    return null;
  }
  const reference = encodeURIComponent(order.reference);
  return `/bank/${reference}/${transferCodes.codeFor(order.reference)}`;
}

/** The bank reads what to pay (GET) and sends the transfer (POST) at the link the email carried. */
function transfer(method: string, reference: string, code: string): ShopHttpResult {
  const order = transferOrder(reference);
  if (!order || !transferCodes.matches(reference, code)) {
    return { status: 404, body: { message: 'That payment link is not valid.' } };
  }
  return { status: 200, body: transferDetails(method === 'POST' ? payTransfer(reference) : order) };
}

function transferDetails(order: ShopOrder): TransferDetails {
  return {
    reference: order.reference,
    totalCents: order.totalCents,
    payee: MARLOW_ACCOUNT.name,
    iban: MARLOW_ACCOUNT.iban,
    bic: MARLOW_ACCOUNT.bic,
    state: order.paidAt ? 'paid' : order.fulfillment === 'cancelled' ? 'cancelled' : 'due',
  };
}

/**
 * Opens a session for a Neon account the database already accepted. The browser does not choose the
 * role: it comes from `app_private`.
 */
export function openSession(actor: Actor): { token: string; actor: Actor } {
  return { token: seal.issue(actor), actor };
}

/** The person behind a request, or null without a live session. */
export function actorOf(authorization: string | null): Actor | null {
  const token = tokenFrom(authorization);
  return token ? seal.read(token) : null;
}

/** A reloaded page asks whose session it saved; the answer is 401 once the session has ended. */
function savedSession(authorization: string | null): ShopHttpResult {
  const actor = actorOf(authorization);
  if (!actor) {
    return { status: 401, body: { message: 'That session has ended. Sign in again.' } };
  }
  return { status: 200, body: { token: tokenFrom(authorization), actor } };
}

function tokenFrom(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function parseDraft(body: unknown): CheckoutDraft {
  const record = asRecord(body);
  const contact = asRecord(record['contact']);
  const lines = record['lines'];
  if (!Array.isArray(lines)) {
    throw new ShopRuleError('Add a piece before checkout.');
  }
  // A checkout page from before the choice existed always shipped.
  const delivery = readOptionalString(record, 'delivery') || 'ship';
  return {
    contact: {
      name: readString(contact, 'name'),
      email: readString(contact, 'email'),
      phone: readString(contact, 'phone'),
    },
    delivery,
    shipping: delivery === 'ship' ? parseShipping(record['shipping']) : null,
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

/** The address of an order that ships, or null when none came, which the order book refuses. */
function parseShipping(value: unknown): ShippingDetails | null {
  if (value === null || value === undefined) {
    return null;
  }
  const shipping = asRecord(value);
  return {
    line1: readString(shipping, 'line1'),
    city: readString(shipping, 'city'),
    region: readOptionalString(shipping, 'region'),
    postalCode: readOptionalString(shipping, 'postalCode'),
    country: readString(shipping, 'country'),
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

/** A field a country may not have, such as the region or, in Hong Kong, the postal code. */
function readOptionalString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
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
