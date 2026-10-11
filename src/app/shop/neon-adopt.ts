import type { Actor, ShopRole } from './access';
import type { FreshSignIn } from './account-server';
import { NEON_DATA_API_URL } from './neon-public';
import { openSession } from './shop-server';
import type { ShopHttpResult } from './shop-server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A Neon Auth token the Data API accepted, read into the shop's terms. */
export interface NeonIdentity {
  readonly actor: Actor;
  /** When Neon issued this token, in milliseconds. */
  readonly issuedAt: number;
  /** When the account was created, in milliseconds, when the token says so. */
  readonly createdAt: number | null;
}

export interface NeonAdoption {
  readonly result: ShopHttpResult;
  readonly identity: NeonIdentity | null;
  /** The browser opened this session straight after creating the account. */
  readonly signedUp: boolean;
}

/**
 * Turns a Neon Auth token into a shop session.
 * The Data API must accept the token first. The role comes from current_shop_role, not from the token payload.
 */
export async function adoptNeonSession(body: unknown): Promise<NeonAdoption> {
  const token = readToken(body);
  const identity = token ? await verifyNeonToken(token) : null;
  if (!identity) {
    return {
      result: { status: 401, body: { message: 'That session is not a Marlow account.' } },
      identity: null,
      signedUp: false,
    };
  }
  return {
    result: { status: 200, body: openSession(identity.actor) },
    identity,
    signedUp: readSignedUp(body),
  };
}

/** Accepts a token only if the Data API does, so a forged or expired token never becomes a person. */
export async function verifyNeonToken(token: string): Promise<NeonIdentity | null> {
  const dataApi = process.env['NEON_DATA_API_URL'] || NEON_DATA_API_URL;
  let response: Response;
  try {
    response = await fetch(`${dataApi}/rpc/current_shop_role`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
  } catch {
    return null;
  }
  if (!response.ok) {
    return null;
  }
  const role = readRole(await response.json());
  const claims = readClaims(token);
  if (!role || !claims || !UUID.test(claims.sub)) {
    return null;
  }
  return {
    actor: {
      id: claims.sub,
      role,
      name: claims.name || claims.email || 'Client',
      email: claims.email,
    },
    issuedAt: claims.issuedAt,
    createdAt: claims.createdAt,
  };
}

/** The fresh sign-in the account page asks for before it deletes an account. */
export const verifyFreshNeonSignIn: FreshSignIn = async (token) => {
  const identity = await verifyNeonToken(token);
  return identity ? { id: identity.actor.id, issuedAt: identity.issuedAt } : null;
};

function readToken(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('token' in body)) {
    return null;
  }
  const token = body.token;
  return typeof token === 'string' && token.split('.').length === 3 ? token : null;
}

function readSignedUp(body: unknown): boolean {
  return Boolean(body && typeof body === 'object' && 'signedUp' in body && body.signedUp === true);
}

function readRole(body: unknown): ShopRole | null {
  const value = typeof body === 'string' ? body : null;
  return value === 'owner' || value === 'worker' || value === 'client' ? value : null;
}

function readClaims(token: string): {
  sub: string;
  email: string;
  name: string;
  issuedAt: number;
  createdAt: number | null;
} | null {
  const part = token.split('.')[1];
  if (!part) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const text = (key: string): string => (typeof record[key] === 'string' ? record[key] : '');
    const iat = typeof record['iat'] === 'number' ? record['iat'] * 1000 : 0;
    return {
      sub: text('sub'),
      email: text('email'),
      name: text('name'),
      issuedAt: iat,
      createdAt: moment(record['createdAt']),
    };
  } catch {
    return null;
  }
}

/** A claim that may be an ISO date or seconds since the epoch, in milliseconds. */
function moment(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}
