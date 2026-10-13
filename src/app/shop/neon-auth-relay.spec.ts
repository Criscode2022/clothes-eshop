import { relayNeonAuth } from './neon-auth-relay';

const NEON = 'https://ep-test.neonauth.example/neondb/auth';

describe('Neon Auth relay through the shop domain', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes the call on with the shop cookie and origin, and hands back the session cookie as the shop own', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"redirect":false}', {
        status: 200,
        headers: [
          ['content-type', 'application/json'],
          ['set-auth-jwt', 'jwt-value'],
          [
            'set-cookie',
            '__Secure-neon-auth.session_token=abc; Domain=neonauth.example; Path=/; HttpOnly; Secure; SameSite=None; Partitioned',
          ],
        ],
      }),
    );
    const request = new Request('https://marlow.shop/api/auth/sign-in/email?source=page', {
      method: 'POST',
      headers: {
        origin: 'https://marlow.shop',
        'content-type': 'application/json',
        cookie: '__Secure-neon-auth.session_token=old; marlow.theme=dark',
      },
      body: '{"email":"ada@example.com"}',
    });

    const response = await relayNeonAuth(NEON, request, 'sign-in/email');

    const [url, init] = upstream.mock.calls[0] ?? [];
    const sent = new Headers(init?.headers);
    expect(String(url)).toBe(`${NEON}/sign-in/email?source=page`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"email":"ada@example.com"}');
    expect(sent.get('origin')).toBe('https://marlow.shop');
    expect(sent.get('cookie')).toContain('__Secure-neon-auth.session_token=old');
    expect(sent.get('cookie')).not.toContain('marlow.theme');

    expect(response.status).toBe(200);
    expect(response.headers.get('set-auth-jwt')).toBe('jwt-value');
    expect(await response.text()).toBe('{"redirect":false}');
    const [cookie = ''] = response.headers.getSetCookie();
    expect(cookie).toContain('__Secure-neon-auth.session_token=abc');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toMatch(/Domain=/i);
    expect(cookie).not.toMatch(/Partitioned/i);
  });

  it('refuses a path that is not a Neon Auth route, without calling Neon', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch');

    const response = await relayNeonAuth(
      NEON,
      new Request('https://marlow.shop/api/auth/x'),
      '../../rest/v1/orders',
    );

    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});
