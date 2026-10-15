import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Actor, ShopRole } from './access';
import { serverKey } from './server-key';

/**
 * A Neon session ends after 12 hours; the browser then asks Neon Auth again, so a changed role or a
 * signed-out device catches up within hours.
 */
const LIFETIME_MS = 12 * 60 * 60_000;

/**
 * Every session is a Neon account's. Tokens signed for the retired floor accounts start with `floor_`,
 * so they no longer read, even before they run out.
 */
const PREFIX = 'neon_';

const ROLES: readonly ShopRole[] = ['client', 'worker', 'owner'];

/**
 * Signs shop sessions so every server process can read them without sharing memory: a restart or a new
 * deploy starts a fresh process. A token is `neon_<payload>.<signature>`, where the payload names the
 * person and when the session ends, and the HMAC covers the prefix too.
 */
export class SessionSeal {
  constructor(
    private readonly key: Uint8Array,
    private readonly now: () => number = () => Date.now(),
  ) {}

  issue(actor: Actor): string {
    const payload = Buffer.from(
      JSON.stringify({ actor, expiresAt: this.now() + LIFETIME_MS }),
    ).toString('base64url');
    const unsigned = `${PREFIX}${payload}`;
    return `${unsigned}.${this.sign(unsigned)}`;
  }

  /** The person behind a token this shop signed, or null when it is forged, from another key, or over. */
  read(token: string): Actor | null {
    const dot = token.lastIndexOf('.');
    if (
      !token.startsWith(PREFIX) ||
      dot < 0 ||
      !this.signs(token.slice(0, dot), token.slice(dot + 1))
    ) {
      return null;
    }
    const payload = payloadOf(token.slice(PREFIX.length, dot));
    return payload && payload.expiresAt > this.now() ? payload.actor : null;
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

export function sessionKeyFrom(secret: string | undefined): Uint8Array {
  return serverKey(secret, 'marlow shop sessions');
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
