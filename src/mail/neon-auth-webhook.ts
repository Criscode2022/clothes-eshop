import { createPublicKey, verify } from 'node:crypto';
import type { JsonWebKey } from 'node:crypto';
import type { AuthDelivery } from './shop-mail';
import type { AuthPurpose } from './shop-emails';

/** Finds the public key Neon Auth signed with, by its key id. */
export type WebhookKeys = (kid: string) => Promise<JsonWebKey | null>;

export interface WebhookHeaders {
  readonly signature: string;
  readonly kid: string;
  readonly timestamp: string;
}

export class WebhookRejected extends Error {}

/** Neon's own advice: a delivery older than this may be a replay. */
const FRESHNESS_MS = 5 * 60_000;

/**
 * Checks that Neon Auth sent this body: a detached Ed25519 JWS (`header..signature`) over
 * `header.base64url(timestamp + "." + base64url(rawBody))`, with the key from the branch's JWKS.
 * Returns the parsed event, or throws WebhookRejected.
 */
export async function verifyNeonWebhook(
  rawBody: string,
  headers: WebhookHeaders,
  keys: WebhookKeys,
  now: number = Date.now(),
): Promise<unknown> {
  const [protectedHeader, emptyPayload, signature] = headers.signature.split('.');
  if (!protectedHeader || emptyPayload !== '' || !signature || !headers.kid || !headers.timestamp) {
    throw new WebhookRejected('The webhook signature is malformed.');
  }
  const sentAt = Number(headers.timestamp);
  const sentAtMs = sentAt < 1e12 ? sentAt * 1000 : sentAt;
  if (!Number.isFinite(sentAtMs) || Math.abs(now - sentAtMs) > FRESHNESS_MS) {
    throw new WebhookRejected('The webhook is too old.');
  }
  const jwk = await keys(headers.kid);
  if (!jwk) {
    throw new WebhookRejected('The webhook was signed with an unknown key.');
  }
  const signedPayload = base64url(`${headers.timestamp}.${base64url(rawBody)}`);
  const valid = verify(
    null,
    Buffer.from(`${protectedHeader}.${signedPayload}`),
    createPublicKey({ key: jwk, format: 'jwk' }),
    Buffer.from(signature, 'base64url'),
  );
  if (!valid) {
    throw new WebhookRejected('The webhook signature does not match.');
  }
  return JSON.parse(rawBody) as unknown;
}

/** A forged key id must not make the server fetch Neon's keys on every request. */
const KEY_REFRESH_MS = 60_000;

/** The branch's published keys, fetched once and refreshed only for a new key id, at most once a minute. */
export function neonAuthKeys(
  authUrl: string,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): WebhookKeys {
  let cached: JsonWebKey[] = [];
  let fetchedAt = Number.NEGATIVE_INFINITY;
  return async (kid) => {
    const known = cached.find((key) => key['kid'] === kid);
    if (known) {
      return known;
    }
    if (now() - fetchedAt < KEY_REFRESH_MS) {
      return null;
    }
    fetchedAt = now();
    const response = await fetcher(`${authUrl}/.well-known/jwks.json`);
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { keys?: JsonWebKey[] };
    cached = Array.isArray(body.keys) ? body.keys : [];
    return cached.find((key) => key['kid'] === kid) ?? null;
  };
}

/** The last few event ids already handled. Neon retries a slow delivery, and a retry must not send twice. */
export class DeliveredEvents {
  private readonly ids = new Set<string>();

  constructor(private readonly capacity = 500) {}

  has(id: string): boolean {
    return this.ids.has(id);
  }

  add(id: string): void {
    this.ids.add(id);
    for (const oldest of this.ids) {
      if (this.ids.size <= this.capacity) {
        break;
      }
      this.ids.delete(oldest);
    }
  }
}

/** The id Neon gives every delivery, or an empty string. */
export function eventIdOf(event: unknown): string {
  return text(asRecord(event)['event_id']);
}

interface AuthMail {
  authLink(delivery: AuthDelivery & { readonly link: string }): Promise<void>;
  authCode(delivery: AuthDelivery & { readonly code: string }): Promise<void>;
}

const PURPOSES: readonly AuthPurpose[] = ['forget-password', 'email-verification', 'sign-in'];

/** Sends the email a verified Neon Auth event asks for. Events without an email are left alone. */
export async function handleNeonAuthEvent(event: unknown, mail: AuthMail): Promise<void> {
  const record = asRecord(event);
  const data = asRecord(record['event_data']);
  const to = text(asRecord(record['user'])['email']);
  const expiresAt = Date.parse(text(data['expires_at'])) || Date.now() + 15 * 60_000;
  switch (record['event_type']) {
    case 'send.magic_link': {
      const kind = purpose(data['link_type']);
      const link = text(data['link_url']);
      if (to && kind && link) {
        await mail.authLink({ kind, to, link, expiresAt });
      }
      return;
    }
    case 'send.otp': {
      const kind = purpose(data['otp_type']);
      const code = text(data['otp_code']);
      if (to && kind && code) {
        await mail.authCode({ kind, to, code, expiresAt });
      }
      return;
    }
    default:
      return;
  }
}

function purpose(value: unknown): AuthPurpose | null {
  return PURPOSES.find((item) => item === value) ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function base64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}
