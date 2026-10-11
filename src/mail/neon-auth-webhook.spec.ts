import { generateKeyPairSync, sign } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import {
  DeliveredEvents,
  handleNeonAuthEvent,
  neonAuthKeys,
  verifyNeonWebhook,
} from './neon-auth-webhook';
import type { WebhookKeys } from './neon-auth-webhook';

const NOW = Date.parse('2026-10-11T10:00:00Z');
const KID = 'key-1';

function keyPair(): { privateKey: KeyObject; keys: WebhookKeys } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID };
  return { privateKey, keys: async (kid) => (kid === KID ? jwk : null) };
}

/** Signs a body the way Neon Auth does: a detached JWS over the timestamp and the base64url body. */
function neonSignature(privateKey: KeyObject, body: string, timestamp: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', kid: KID })).toString('base64url');
  const payload = Buffer.from(`${timestamp}.${Buffer.from(body).toString('base64url')}`).toString(
    'base64url',
  );
  const signature = sign(null, Buffer.from(`${header}.${payload}`), privateKey).toString(
    'base64url',
  );
  return `${header}..${signature}`;
}

const RESET = JSON.stringify({
  event_id: 'evt-1',
  event_type: 'send.magic_link',
  timestamp: '2026-10-11T10:00:00Z',
  user: { email: 'ada@example.com', name: 'Ada' },
  event_data: {
    link_type: 'forget-password',
    link_url:
      'https://auth.example/reset-password/abc?callbackURL=https%3A%2F%2Fmarlow.shop%2Freset-password',
    token: 'abc',
    expires_at: '2026-10-11T10:15:00Z',
  },
});

describe('Neon Auth webhook signature', () => {
  const { privateKey, keys } = keyPair();
  const timestamp = String(NOW - 10_000);

  function headers(body: string, at = timestamp) {
    return { signature: neonSignature(privateKey, body, at), kid: KID, timestamp: at };
  }

  it('accepts a body Neon signed a moment ago', async () => {
    const event = await verifyNeonWebhook(RESET, headers(RESET), keys, NOW);

    expect(event).toMatchObject({ event_id: 'evt-1', event_type: 'send.magic_link' });
  });

  it('refuses a body changed after signing', async () => {
    const forged = RESET.replace('ada@example.com', 'eve@example.com');

    await expect(verifyNeonWebhook(forged, headers(RESET), keys, NOW)).rejects.toThrow();
  });

  it('refuses a replay older than five minutes', async () => {
    const old = String(NOW - 6 * 60_000);

    await expect(verifyNeonWebhook(RESET, headers(RESET, old), keys, NOW)).rejects.toThrow();
  });

  it('refuses a key Neon does not publish, and a signature with a payload in it', async () => {
    await expect(
      verifyNeonWebhook(RESET, { ...headers(RESET), kid: 'unknown' }, keys, NOW),
    ).rejects.toThrow();
    const signed = headers(RESET);
    const [header, , signature] = signed.signature.split('.');
    await expect(
      verifyNeonWebhook(RESET, { ...signed, signature: `${header}.e30.${signature}` }, keys, NOW),
    ).rejects.toThrow();
  });
});

describe('Neon Auth events', () => {
  function recordingMail() {
    const links: unknown[] = [];
    const codes: unknown[] = [];
    return {
      links,
      codes,
      mail: {
        authLink: async (delivery: unknown) => void links.push(delivery),
        authCode: async (delivery: unknown) => void codes.push(delivery),
      },
    };
  }

  it('delivers a password reset link to the account email', async () => {
    const { mail, links } = recordingMail();

    await handleNeonAuthEvent(JSON.parse(RESET), mail);

    expect(links).toEqual([
      {
        kind: 'forget-password',
        to: 'ada@example.com',
        link: 'https://auth.example/reset-password/abc?callbackURL=https%3A%2F%2Fmarlow.shop%2Freset-password',
        expiresAt: Date.parse('2026-10-11T10:15:00Z'),
      },
    ]);
  });

  it('delivers a one-time code', async () => {
    const { mail, codes } = recordingMail();

    await handleNeonAuthEvent(
      {
        event_type: 'send.otp',
        user: { email: 'ada@example.com' },
        event_data: {
          otp_code: '482913',
          otp_type: 'email-verification',
          expires_at: '2026-10-11T10:10:00Z',
        },
      },
      mail,
    );

    expect(codes).toEqual([
      {
        kind: 'email-verification',
        to: 'ada@example.com',
        code: '482913',
        expiresAt: Date.parse('2026-10-11T10:10:00Z'),
      },
    ]);
  });

  it('ignores events the shop does not send email for', async () => {
    const { mail, links, codes } = recordingMail();

    await handleNeonAuthEvent(
      { event_type: 'user.created', user: { email: 'ada@example.com' } },
      mail,
    );

    expect([...links, ...codes]).toEqual([]);
  });
});

describe('delivered events', () => {
  it('remembers recent deliveries so a retry never sends the email twice', () => {
    const delivered = new DeliveredEvents(2);

    delivered.add('evt-1');
    delivered.add('evt-2');
    delivered.add('evt-3');

    expect(delivered.has('evt-1')).toBe(false);
    expect(delivered.has('evt-2')).toBe(true);
    expect(delivered.has('evt-3')).toBe(true);
  });
});

describe('Neon Auth keys', () => {
  it('fetches the key set once, and refreshes it for an unknown key at most once a minute', async () => {
    let fetches = 0;
    let now = NOW;
    const fetcher = (async () => {
      fetches += 1;
      return new Response(
        JSON.stringify({ keys: [{ kid: 'key-1', kty: 'OKP', crv: 'Ed25519', x: 'abc' }] }),
      );
    }) as typeof fetch;
    const keys = neonAuthKeys('https://auth.example', fetcher, () => now);

    expect(await keys('key-1')).toMatchObject({ kid: 'key-1' });
    expect(await keys('key-1')).toMatchObject({ kid: 'key-1' });
    expect(await keys('forged-1')).toBeNull();
    expect(await keys('forged-2')).toBeNull();
    expect(fetches).toBe(1);

    now += 61_000;
    expect(await keys('forged-3')).toBeNull();
    expect(fetches).toBe(2);
  });
});
