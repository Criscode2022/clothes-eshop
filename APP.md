# This app

Rules and context for this app only. Agents read this file after [PROJECT.md](PROJECT.md), and where the two differ, this file wins, except that it can't loosen the rules on secrets and Neon. PROJECT.md comes from the template, and `npm run update-from-template` brings in its newer versions. That update never changes this file, so keep everything specific to this app here.

## What the app is

Marlow is a ready-to-wear clothes shop with three audiences.

- Clients browse the public floor, build a bag, and check out. An account is optional. A guest order is stored without a client id. A signed-in client sees only the orders stored with that client's id.
- The owner runs the backoffice at `/owner`: create and edit pieces (price, sizes and colors, stock) and see every order.
- Shop workers use the daily desk at `/desk`: list orders, move fulfillment (including completed and cancelled), and change on-hand stock. They cannot change prices or other catalog administration.

Visitors and clients cannot open the desk or the backoffice. A worker cannot open owner-only actions.

## Decisions

- The app type is `ssr` in `preferences.json`. The public catalog is server-rendered. Bag, checkout, account, desk, and backoffice are client-rendered because they depend on the signed-in person or the bag in the browser.
- `security.allowedHosts` is `marlow.shop`. Local production runs set `NG_ALLOWED_HOSTS=localhost`. It is never `*`.
- Prices are integer US cents. The page formats them as `$420.00`. Shipping is $8.00, and free when the pieces total at least $200.00. The order total is the sum of the line prices plus shipping.
- Each piece has at least one size or color variant, and each variant has its own stock. A bag line cannot go above that stock.
- Payment records one of three methods: pay at the shop, bank transfer, or cash when it arrives. The shop never asks for or stores a card number, and it does not call a payment provider. That write happens on the Node server, because anonymous database grants are select-only.
- Staff roles live in `app_private`, not on a profile column the person can edit. The migrations are `db/migrations/001_marlow_shop.sql` and `db/migrations/002_marlow_cloth.sql`. The second adds a slug plus composition and care, and the missing sizes, so the floor ids match the database.
- The public Auth URL and Data API URL live in `src/app/shop/neon-public.ts`. They are not secrets. `DATABASE_URL` stays in the gitignored `.env` and is read only by the Node server. The browser never receives a connection string.
- When `DATABASE_URL` is set, the server loads the branch into the shared shop book before each request and writes successful orders, prices, stock, and new pieces back. Guest orders are still inserted by that server, because anonymous has no write grant. A client id is stored only when it exists in `neon_auth.user`. Without `DATABASE_URL`, the same book stays in memory and the tests keep using it.
- Floor accounts still open the three sections. The password is `marlow-floor`. Avery Cole (`avery@marlow.shop`) and Noah Pell (`noah@marlow.shop`) are clients. Jordan Hale (`jordan@marlow.shop`) is a worker. Sloan Marlow (`sloan@marlow.shop`) is the owner. These are demo people, not a connection string or an API token. A shopper can also create a Neon Auth account. The role for that account comes from `app_private` through `current_shop_role`, not from a field the person can edit.
- The public floor shows a photograph, composition, care, and fit for each seeded piece, the amount left until shipping is free, a checkout summary, and an atelier page at `/atelier`. `/atelier` is server-rendered with the catalog.

## Rules

- Do not add Ionic, a service worker, or Angular Native.
- Keep colors on the tokens in `src/styles.scss`. Tailwind reads those tokens; do not add `tailwind.config.js` or `@tailwind` directives.
- Guest checkout stays on the public path. Do not put a sign-in wall in front of it.
- Do not put payment-provider calls or email sending in browser code.
