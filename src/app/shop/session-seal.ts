import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Actor, ShopRole } from './access';
import { accountKindOf } from './session-tokens';
import type { AccountKind } from './session-tokens';

const HOUR_MS = 60 * 60_000;

/**
 * How long a session lasts. A Neon session ends sooner: the browser then asks Neon Auth again, so a
 * changed role or a signed-out device catches up within hours. Floor accounts are fixed demo people.
 */
const LIFETIME_MS: Record<AccountKind, number> = {
  floor: 7 * 24 * HOUR_MS,
  neon: 12 * HOUR_MS,
};

const ROLES: readonly ShopRole[] = ['client', 'worker', 'owner'];

export interface SessionClaims {
  readonly actor: Actor;
  readonly kind: AccountKind;
}

/**
 * Signs shop sessions so every server instance can read them without sharing memory: Netlify runs the
 * shop as functions that start, stop, and run side by side. A token is `<kind>_<payload>.<signature>`,
 * where the payload names the person and when the session ends, and the HMAC covers the kind too.
 */
export class SessionSeal {
  constructor(
    private readonly key: Uint8Array,
    private readonly now: () => number = () => Date.now(),
  ) {}

  issue(kind: AccountKind, actor: Actor): string {
    const payload = Buffer.from(
      JSON.stringify({ actor, expiresAt: this.now() + LIFETIME_MS[kind] }),
    ).toString('base64url');
    const unsigned = `${kind}_${payload}`;
    return `${unsigned}.${this.sign(unsigned)}`;
  }

  /** The person behind a token this shop signed, or null when it is forged, from another key, or over. */
  read(token: string): SessionClaims | null {
    const kind = accountKindOf(token);
    const dot = token.lastIndexOf('.');
    if (!kind || dot < 0 || !this.signs(token.slice(0, dot), token.slice(dot + 1))) {
      return null;
    }
    const payload = payloadOf(token.slice(`${kind}_`.length, dot));
    return payload && payload.expiresAt > this.now() ? { actor: payload.actor, kind } : null;
  }

  private sign(unsigned: string): string {
    return createHmac('sha256', this.key).update(unsigned).digest('base64url');
  }

  private signs(unsigned: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(unsigned));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}

/**
 * The signing key. Every instance derives the same one from the server's secret, so they agree without
 * another setting; the derivation is one-way, so the key never reveals the secret. Without a secret, one
 * process signs with a random key, and its sessions end when it stops.
 */
export function sessionKeyFrom(secret: string | undefined): Uint8Array {
  if (!secret) {
    return randomBytes(32);
  }
  return new Uint8Array(hkdfSync('sha256', secret, '', 'marlow shop sessions', 32));
}

function payloadOf(encoded: string): { actor: Actor; expiresAt: number } | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!isRecord(value) || typeof value['expiresAt'] !== 'number' || !isActor(value['actor'])) {
      return null;
    }
    return { actor: value['actor'], expiresAt: value['expiresAt'] };
  } catch {
    return null;
  }
}

function isActor(value: unknown): value is Actor {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    ROLES.includes(value['role'] as ShopRole) &&
    typeof value['name'] === 'string' &&
    typeof value['email'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
