import type { Actor } from './access';
import { unlinkClientOrders } from './order-book';
import { actorOf, openSession } from './shop-server';
import type { ShopHttpResult } from './shop-server';

/** Where real (Neon) accounts live. The Node server reaches it through the database; the browser never does. */
export interface AccountDirectory {
  rename(id: string, name: string): Promise<void>;
  /** Unlinks the account's orders and removes the account, as one step. */
  remove(id: string): Promise<void>;
}

/** Checks a Neon token the browser obtained by signing in again, and says whose it is and when it was issued. */
export type FreshSignIn = (token: string) => Promise<{ id: string; issuedAt: number } | null>;

export interface AccountServerDeps {
  /** Null when the shop runs without a database, where real accounts cannot be changed. */
  readonly directory: AccountDirectory | null;
  readonly verifyFreshSignIn: FreshSignIn;
  readonly now: () => number;
}

/** A sign-in counts as fresh for deleting an account for this long. */
const FRESH_SIGN_IN_MS = 5 * 60_000;
const NAME_LIMITS = { min: 2, max: 80 } as const;

/**
 * Changes and deletes the signed-in person's own account. Returns null for any route it does not own,
 * so the caller can hand the request on to the shop.
 */
export async function handleAccountHttp(
  method: string,
  path: string,
  body: unknown,
  authorization: string | null,
  deps: AccountServerDeps,
): Promise<ShopHttpResult | null> {
  if (path !== '/api/account') {
    return null;
  }
  const verb = method.toUpperCase();
  if (verb === 'PATCH') {
    return rename(body, authorization, deps);
  }
  if (verb === 'DELETE') {
    return remove(body, authorization, deps);
  }
  return null;
}

async function rename(
  body: unknown,
  authorization: string | null,
  deps: AccountServerDeps,
): Promise<ShopHttpResult> {
  const gate = signedInAccount(authorization, deps, 'change');
  if ('refusal' in gate) {
    return gate.refusal;
  }
  const { actor, directory } = gate;
  const name = readField(body, 'name').trim().replace(/\s+/g, ' ');
  if (name.length < NAME_LIMITS.min || name.length > NAME_LIMITS.max) {
    return problem(400, 'Enter your name, at least 2 letters.');
  }
  await directory.rename(actor.id, name);
  // The session carries the name, so the browser gets one under the new name.
  return { status: 200, body: openSession({ ...actor, name }) };
}

async function remove(
  body: unknown,
  authorization: string | null,
  deps: AccountServerDeps,
): Promise<ShopHttpResult> {
  const gate = signedInAccount(authorization, deps, 'delete');
  if ('refusal' in gate) {
    return gate.refusal;
  }
  const { actor, directory } = gate;
  if (actor.role !== 'client') {
    return problem(403, 'Staff accounts are closed by the owner, not from this page.');
  }
  const signIn = await deps.verifyFreshSignIn(readField(body, 'token'));
  const fresh = signIn !== null && deps.now() - signIn.issuedAt <= FRESH_SIGN_IN_MS;
  if (!fresh || signIn.id !== actor.id) {
    return problem(401, 'Enter your password again to delete the account.');
  }
  await directory.remove(actor.id);
  unlinkClientOrders(actor.id);
  return { status: 200, body: { deleted: true } };
}

type AccountGate =
  | { readonly refusal: ShopHttpResult }
  | { readonly actor: Actor; readonly directory: AccountDirectory };

/** Only a signed-in account, in a shop with a database, may change itself. */
function signedInAccount(
  authorization: string | null,
  deps: AccountServerDeps,
  action: 'change' | 'delete',
): AccountGate {
  const actor = actorOf(authorization);
  if (!actor) {
    return { refusal: problem(401, `Sign in to ${action} your account.`) };
  }
  if (!deps.directory) {
    return { refusal: problem(503, `The shop needs its database to ${action} an account.`) };
  }
  return { actor, directory: deps.directory };
}

function readField(body: unknown, key: string): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return '';
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function problem(status: number, message: string): ShopHttpResult {
  return { status, body: { message } };
}
