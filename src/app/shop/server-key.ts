import { hkdfSync, randomBytes } from 'node:crypto';

/**
 * A signing key for one purpose. Every server process derives the same one from the server's secret, so
 * they agree without another setting; the derivation is one-way, so the key never reveals the secret,
 * and each purpose gets its own key. Without a secret, one process signs with a random key, and what it
 * signed stops working when it stops.
 */
export function serverKey(secret: string | undefined, purpose: string): Uint8Array {
  if (!secret) {
    return randomBytes(32);
  }
  return new Uint8Array(hkdfSync('sha256', secret, '', purpose, 32));
}
