import { createHmac } from 'node:crypto';
import type { Actor } from './access';
import { SessionSeal, sessionKeyFrom } from './session-seal';

const ADA: Actor = {
  id: '5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  role: 'client',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

const HOUR = 60 * 60_000;
const NOW = Date.parse('2026-10-14T10:00:00Z');
const SECRET = 'postgres://shop-secret';

function sealAt(time: () => number, secret = SECRET): SessionSeal {
  return new SessionSeal(sessionKeyFrom(secret), time);
}

/** A token as the shop signed them for its shared floor accounts, before they were retired. */
function floorToken(actor: Actor): string {
  const payload = Buffer.from(JSON.stringify({ actor, expiresAt: NOW + HOUR })).toString(
    'base64url',
  );
  const unsigned = `floor_${payload}`;
  const signature = createHmac('sha256', sessionKeyFrom(SECRET))
    .update(unsigned)
    .digest('base64url');
  return `${unsigned}.${signature}`;
}

describe('signed shop sessions', () => {
  it('is read by any server that shares the key, as after a restart', () => {
    const token = sealAt(() => NOW).issue(ADA);

    expect(sealAt(() => NOW).read(token)).toEqual(ADA);
  });

  it('is refused by a server with another key', () => {
    const token = sealAt(() => NOW).issue(ADA);

    expect(sealAt(() => NOW, 'postgres://another-secret').read(token)).toBeNull();
  });

  it('refuses a token changed by hand', () => {
    const token = sealAt(() => NOW).issue(ADA);
    const signature = token.slice(token.lastIndexOf('.') + 1);
    const forgedPayload = Buffer.from(
      JSON.stringify({ actor: { ...ADA, role: 'owner' }, expiresAt: NOW + HOUR }),
    ).toString('base64url');

    expect(sealAt(() => NOW).read(`neon_${forgedPayload}.${signature}`)).toBeNull();
    expect(sealAt(() => NOW).read('neon_not-a-session')).toBeNull();
  });

  it('refuses a session signed for one of the retired floor accounts', () => {
    const owner: Actor = { ...ADA, role: 'owner', email: 'sloan@marlow.shop' };

    expect(sealAt(() => NOW).read(floorToken(owner))).toBeNull();
  });

  it('ends a session after 12 hours, so Neon Auth vouches for the person again', () => {
    let now = NOW;
    const seal = sealAt(() => now);
    const token = seal.issue(ADA);

    now = NOW + 12 * HOUR - 1;
    expect(seal.read(token)).toEqual(ADA);
    now = NOW + 12 * HOUR;
    expect(seal.read(token)).toBeNull();
  });

  it('signs with a random key when there is no secret to share, so nothing is guessable', () => {
    const token = new SessionSeal(sessionKeyFrom(undefined)).issue(ADA);

    expect(new SessionSeal(sessionKeyFrom(undefined)).read(token)).toBeNull();
  });
});
