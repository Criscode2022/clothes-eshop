# Sessions: how Marlow knows who you are

Written 2026-10-15. It explains the design as it stands; nothing here is a change. [APP.md](APP.md) keeps the rules, this file the reasons.

Marlow has two sessions, and they do different jobs:

|                    | Neon Auth's session                                                                               | The shop's session                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Issued by          | Neon Auth                                                                                         | The shop's Node server                                                              |
| Lives in           | A cookie. Since 2026-10-15 it is set on the shop's own host, through the `/api/auth` relay.       | `localStorage`, under `marlow.session`                                              |
| Proves             | Who you are, to Neon Auth                                                                         | Who you are and your role, to the shop's API                                        |
| Looks like         | Neon's own session cookie                                                                         | `neon_<payload>.<signature>`: the payload names you, your role, and when it ends    |
| Lasts              | As long as Neon Auth keeps it                                                                     | 12 hours                                                                            |
| Reaches the server | Only on calls to `/api/auth/*` (Neon Auth's own routes, relayed)                                  | On every shop API call, as `Authorization: Bearer <token>`                          |
| Used for           | Signing in, renewing the shop's session, changing the password, deleting the account, signing out | Everything else: orders, cancelling, the desk, the backoffice, renaming the account |

Neon's cookie is still used. It is just not what the shop's API reads on each request.

## Signing in

1. The sign-in page calls `ShopClient.signInWithNeon`. In the browser, `NeonAuth.sessionToken` signs in with Neon Auth (`signIn.email`), which sets Neon's session cookie.
2. The browser asks Neon Auth for a short-lived JWT (`token()`), on the strength of that cookie.
3. The browser sends the JWT to the shop: `POST /api/session/neon`.
4. The server (`adoptNeonSession` in `src/app/shop/neon-adopt.ts`) calls Neon's Data API, `rpc/current_shop_role`, with that JWT. The Data API checks the JWT's signature against Neon's keys; if it refuses, the sign-in fails. The shop never trusts a token the Data API did not accept. The role (client, worker, or owner) comes back from `current_shop_role`, which reads `app_private.user_roles`, never from anything the person can edit. The person's id, name, and email come from the JWT.
5. The server issues the shop's own session (`openSession`, `SessionSeal` in `src/app/shop/session-seal.ts`): `neon_<payload>.<HMAC-SHA256>`, where the payload is the person and the time the session ends.
6. The browser keeps it in memory (`ShopSession`) and in `localStorage` (`SavedSession`).

## Every request after that

`ShopClient.request` sends the token as `Authorization: Bearer <token>`. The server (`actorOf` in `src/app/shop/shop-server.ts`) checks the prefix, the signature (compared in constant time), and the end time, then applies the access rules (`src/app/shop/access.ts`) to the person and role it names. No database or Neon call is needed to know who is asking.

The signing key comes from `DATABASE_URL` through HKDF (`serverKey` in `src/app/shop/server-key.ts`, purpose `marlow shop sessions`). Every server process derives the same key, so a token survives restarts and deploys, and the derivation is one-way, so the key never reveals the database secret. Without `DATABASE_URL` (tests, a local in-memory shop), each process signs with a random key, and its sessions end when it stops.

## After a reload

The server renders the public pages without knowing who you are: it has no access to `localStorage`. After the first render, `ShopClient.resumeSession` runs once per page load, and the route guards wait for it, so a reload on `/account`, `/desk`, or `/owner` stays put.

- **A saved token that is still good:** `GET /api/session` answers with the person, and the page carries on. Neon Auth is not asked.
- **A saved token that has ended (after 12 hours):** the browser loads the Neon Auth SDK and asks, through Neon's cookie, whether you are still signed in (`getSession`). If you are, it fetches a fresh JWT and trades it at `POST /api/session/neon`, exactly as at sign-in, for a new shop token. If you are not, the saved token is forgotten.
- **No saved token (guests):** nothing is asked, and the Neon Auth SDK never loads.

The 12 hours are deliberate: a role the owner changed, or a sign-out on another device, reaches the shop within that time, because the renewal asks Neon Auth and `current_shop_role` again.

## Signing out, the password, and deleting the account

- **Signing out** forgets the shop's token in the browser and signs out of Neon Auth, which clears its cookie.
- **Renaming** (`PATCH /api/account`) changes the name in the database and hands back a new shop token under the new name.
- **Changing the password** happens in Neon Auth: the browser signs in again with the current password, then changes it with `revokeOtherSessions`. Other devices lose their Neon session at once, and their shop token at its next renewal, within 12 hours.
- **Deleting the account**: the browser signs in again with the password to get a fresh JWT, and sends it with the delete. The server accepts it only for the same person and only within 5 minutes of that sign-in, so an open tab left signed in cannot delete an account.

## Why the shop does not just read Neon's cookie

1. **Until 2026-10-15, the shop's server never received it.** Neon Auth set its cookie on Neon's own domain, and a browser sends a cookie only to the domain that set it. The shop's server could not see it, so the browser had to carry proof across: the JWT exchange above.
2. **The cookie does not carry the role.** Your role lives in the shop's database (`app_private.user_roles`). Reading the cookie on each request would mean asking Neon Auth who you are, and the database what you may do, every time. The shop's token carries the role under the shop's own signature, so any server process checks a request without a network call.
3. **The shop once had accounts with no Neon cookie at all.** The shared floor accounts (retired on 2026-10-15) signed in at the shop alone, so the shop needed a session of its own, and Neon accounts reused it.

## Why `localStorage`, and not a cookie of the shop's own

- **For it:** a header is never sent by the browser on its own, so another site cannot make your browser act as you (cross-site request forgery). It also kept the shop clear of the cookie problems that Safari and the proxy in front of the shop were causing when sessions were built.
- **Against it:** any script running on the shop's pages can read `localStorage`. If someone ever managed to run their own script on the shop (cross-site scripting), they could copy the token and use it until it ends. An `HttpOnly` cookie cannot be read by scripts at all. The risk is low: Angular escapes everything it renders, and the shop loads no third-party scripts. But it is real.
- **Revocation:** a signed token cannot be cancelled early. A copy keeps working until its 12 hours end, even after signing out or deleting the account (a deleted account's token finds no orders). [APP.md](APP.md) records this as an accepted limit.

## What changed on 2026-10-15, and what it allows

Every browser now reaches Neon Auth through the shop's own domain (`/api/auth`, relayed by `relayNeonAuth`), because Safari, Brave, private windows, and browsers that block third-party cookies refused a cookie set by Neon's domain. The relay rewrites Neon's cookie to belong to the shop's host: no `Domain`, not partitioned, `SameSite=Lax`, `Secure`. So Neon's cookie is now first-party, and it does reach the shop's server, which removes reason 1 above.

Two other designs are therefore possible. Neither is in place:

- **The server reads Neon's cookie.** It would ask Neon Auth on each request (or cache the answer for a while), then the database for the role. No token would sit in `localStorage`, at the cost of a Neon call per request or a cache to keep honest.
- **The shop keeps its signed token in its own `HttpOnly`, `Secure`, `SameSite` cookie** instead of `localStorage`. Scripts could no longer read it, which closes the cross-site scripting gap. Requests that change something would then need cross-site request forgery protection, such as checking the `Origin` header, because the browser would send the cookie on its own.

## Where it lives

| File                                | Part                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `src/app/shop/neon-auth.ts`         | The browser's Neon Auth client, pointed at `/api/auth`                           |
| `src/app/shop/neon-auth-relay.ts`   | The server's relay to Neon Auth, which makes its cookie first-party              |
| `src/app/shop/neon-adopt.ts`        | Accepting a Neon JWT through the Data API, and the role from `current_shop_role` |
| `src/app/shop/session-seal.ts`      | Signing and reading the shop's token                                             |
| `src/app/shop/server-key.ts`        | The signing key, derived from `DATABASE_URL`                                     |
| `src/app/shop/shop-server.ts`       | `openSession`, `actorOf`, and `GET /api/session`                                 |
| `src/app/shop/shop-client.ts`       | Sign-in, the Bearer header, `resumeSession`, sign-out                            |
| `src/app/shop/saved-session.ts`     | The token in `localStorage`                                                      |
| `src/app/shop/account-server.ts`    | Renaming, and deleting after a fresh sign-in                                     |
| `db/migrations/001_marlow_shop.sql` | `app_private.user_roles` and `current_shop_role`                                 |
