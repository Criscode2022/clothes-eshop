import type { Actor, ShopRole } from './access';
import { NEON_DATA_API_URL } from './neon-public';
import { openSession } from './shop-server';
import type { ShopHttpResult } from './shop-server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turns a Neon Auth token into a shop session.
 * The Data API must accept the token first. The role comes from current_shop_role, not from the token payload.
 */
export async function adoptNeonSession(body: unknown): Promise<ShopHttpResult> {
  const token = readToken(body);
  if (!token) {
    return { status: 401, body: { message: 'Sign in again.' } };
  }
  const dataApi = process.env['NEON_DATA_API_URL'] || NEON_DATA_API_URL;
  let response: Response;
  try {
    response = await fetch(`${dataApi}/rpc/current_shop_role`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
  } catch {
    return { status: 401, body: { message: 'That session is not a Marlow account.' } };
  }
  if (!response.ok) {
    return { status: 401, body: { message: 'That session is not a Marlow account.' } };
  }
  const role = readRole(await response.json());
  const claims = readClaims(token);
  if (!role || !claims || !UUID.test(claims.sub)) {
    return { status: 401, body: { message: 'That session is not a Marlow account.' } };
  }
  const actor: Actor = {
    id: claims.sub,
    role,
    name: claims.name || claims.email || 'Client',
    email: claims.email,
  };
  return { status: 200, body: openSession(actor) };
}

function readToken(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('token' in body)) {
    return null;
  }
  const token = body.token;
  return typeof token === 'string' && token.split('.').length === 3 ? token : null;
}

function readRole(body: unknown): ShopRole | null {
  const value = typeof body === 'string' ? body : null;
  return value === 'owner' || value === 'worker' || value === 'client' ? value : null;
}

function readClaims(token: string): { sub: string; email: string; name: string } | null {
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
    const sub = typeof record['sub'] === 'string' ? record['sub'] : '';
    const email = typeof record['email'] === 'string' ? record['email'] : '';
    const name = typeof record['name'] === 'string' ? record['name'] : '';
    return { sub, email, name };
  } catch {
    return null;
  }
}
