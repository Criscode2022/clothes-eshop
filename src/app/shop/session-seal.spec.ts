import type { Actor } from './access';
import { SessionSeal, sessionKeyFrom } from './session-seal';
import { accountKindOf } from './session-tokens';

const ADA: Actor = {
  id: '5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  role: 'client',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

const HOUR = 60 * 60_000;
const NOW = Date.parse('2026-10-14T10:00:00Z');

function sealAt(time: () => number, secret = 'postgres://shop-secret'): SessionSeal {
  return new SessionSeal(sessionKeyFrom(secret), time);
}

describe('signed shop sessions', () => {
  it('is read by any server that shares the key, as on another function instance', () => {
    const token = sealAt(() => NOW).issue('neon', ADA);

    expect(sealAt(() => NOW).read(token)).toEqual({ actor: ADA, kind: 'neon' });
  });

  it('is refused by a server with another key', () => {
    const token = sealAt(() => NOW).issue('neon', ADA);

    expect(sealAt(() => NOW, 'postgres://another-secret').read(token)).toBeNull();
  });

  it('refuses a token changed by hand', () => {
    const token = sealAt(() => NOW).issue('floor', ADA);
    const [unsigned = '', signature = ''] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ actor: { ...ADA, role: 'owner' }, expiresAt: NOW + HOUR }),
    ).toString('base64url');

    expect(sealAt(() => NOW).read(`floor_${forgedPayload}.${signature}`)).toBeNull();
    expect(
      sealAt(() => NOW).read(`neon_${unsigned.slice('floor_'.length)}.${signature}`),
    ).toBeNull();
    expect(sealAt(() => NOW).read('neon_not-a-session')).toBeNull();
  });

  it('marks the token with the kind of account, which the browser reads', () => {
    const seal = sealAt(() => NOW);

    expect(accountKindOf(seal.issue('neon', ADA))).toBe('neon');
    expect(accountKindOf(seal.issue('floor', ADA))).toBe('floor');
  });

  it('ends a Neon session after 12 hours, so Neon Auth vouches for the person again', () => {
    let now = NOW;
    const seal = sealAt(() => now);
    const token = seal.issue('neon', ADA);

    now = NOW + 12 * HOUR - 1;
    expect(seal.read(token)?.actor).toEqual(ADA);
    now = NOW + 12 * HOUR;
    expect(seal.read(token)).toBeNull();
  });

  it('keeps a floor session for a week', () => {
    let now = NOW;
    const seal = sealAt(() => now);
    const token = seal.issue('floor', ADA);

    now = NOW + 7 * 24 * HOUR - 1;
    expect(seal.read(token)?.kind).toBe('floor');
    now = NOW + 7 * 24 * HOUR;
    expect(seal.read(token)).toBeNull();
  });

  it('signs with a random key when there is no secret to share, so nothing is guessable', () => {
    const token = new SessionSeal(sessionKeyFrom(undefined)).issue('floor', ADA);

    expect(new SessionSeal(sessionKeyFrom(undefined)).read(token)).toBeNull();
  });
});
