import { handleAuthRequest, parseSetCookies, serializeSetCookie } from '@neondatabase/auth/server';

/** Neon Auth routes are plain segments such as `get-session` or `sign-in/email`; nothing else is relayed. */
const AUTH_PATH = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i;

/** What the browser needs from Neon Auth besides the cookies: the body type and the tokens. */
const RELAYED_HEADERS = ['content-type', 'set-auth-jwt', 'set-auth-token'] as const;

/**
 * Relays one Neon Auth call through the shop's own domain, so the browser keeps Neon Auth's session
 * cookie as a first-party cookie. Safari refuses cookies from Neon Auth's own domain. `path` is what
 * follows `/api/auth`. Neon Auth's request handling comes from its SDK; the cookies are rewritten here.
 */
export async function relayNeonAuth(
  neonAuthUrl: string,
  request: Request,
  path: string,
): Promise<Response> {
  if (!AUTH_PATH.test(path)) {
    return Response.json({ message: 'That auth route does not exist.' }, { status: 404 });
  }
  const upstream = await handleAuthRequest(neonAuthUrl, request, path);
  const headers = new Headers();
  for (const name of RELAYED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    for (const firstParty of asShopCookies(cookie)) {
      headers.append('set-cookie', firstParty);
    }
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

/** Neon Auth's cookie, rewritten to belong to the shop's own host: no Domain, not partitioned, SameSite=Lax. */
function asShopCookies(setCookie: string): string[] {
  return parseSetCookies(setCookie).map((cookie) =>
    serializeSetCookie({
      ...cookie,
      domain: undefined,
      partitioned: undefined,
      sameSite: 'lax',
      secure: true,
    }),
  );
}
