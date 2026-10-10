# This app

Rules and context for this app only. Agents read this file after [PROJECT.md](PROJECT.md), and where the two differ, this file wins, except that it can't loosen the rules on secrets and Neon. PROJECT.md comes from the template, and `npm run update-from-template` brings in its newer versions. That update never changes this file, so keep everything specific to this app here.

## What the app is

Marlow is a ready-to-wear clothes shop with three audiences.

- Clients browse the public floor, build a bag, and check out. An account is optional. A guest order is stored without a client id. A signed-in client sees only the orders stored with that client's id.
- The owner runs the backoffice at `/owner`: every order at `/owner`, pieces (price in dollars, sizes and colors, stock) at `/owner/pieces`, and new pieces at `/owner/new`.
- Shop workers use the daily desk at `/desk`: orders by fulfillment state at `/desk`, including completed and cancelled, and on-hand stock at `/desk/stock`. They cannot change prices or other catalog administration.

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
- The look is the category standard for a quiet-luxury clothes shop, held to the craft of COS, Arket, and Toteme. The owner chose it on 2026-10-03 over novelty directions, and released the earlier magenta accent, Newsreader serif, and copy voice. `DESIGN.md` records the visual system, `PRODUCT.md` the product truth, and `.impeccable/surfaces/` the briefs for the storefront and the task screens.
- Buying takes the fewest steps: sizes can be added from the floor's quick add, the bag opens as a drawer on the line just added, and checkout is one page (contact, delivery, payment) with the order summary in view. A size is chosen by the shopper; the product page preselects one only when it is the last size left in that color.
- The bag is kept in the browser's `localStorage` under `marlow.bag`, restored after the first render so hydration matches the server, and capped at current stock when it comes back.
- The UI is built on Spartan (set up 2026-10-11): Brain from npm and the `lyra` Helm style copied into `src/app/ui/helm/` (`components.json`). `src/tailwind.css` is the Spartan layers file; Spartan's semantic tokens alias the Marlow tokens there, `--accent` is the hover surface (`--color-hover`), `--primary` is the brand, and `--radius` is 0. The owner kept the White Room look; Spartan supplies behavior and structure, not a new style.
- The generated Helm files stay as the CLI wrote them. Marlow's scale rides on top: `ShopButton` adds the shop's button heights to every `hlmBtn` in a template that imports `ShopButtonImports`, and an unlayered block in `src/styles.scss` sets type, padding, and focus on Spartan's `data-slot` parts. Signal Forms fields stay on `TextField`, because Spartan's input marks required fields invalid before they are touched.
- The bag drawer and the phone menu are Spartan sheets inside `@defer` blocks (on idle, or as soon as they are asked to open), which keeps the CDK overlay and tailwind-merge out of the first page and the initial bundle under budget.
- The floor ends with a "Cloth and care" note and a "Shop by category" index; the bag page suggests "More from the floor" through `piecesToPairWith`. Motion includes scroll reveals, chosen by the owner on 2026-10-11, through the `appReveal` directive, which only hides what starts below the fold and never under reduced motion.
- Adding a size keeps opening the bag drawer on the line just added; the owner declined toasts for it on 2026-10-11.

## Rules

- Do not add Ionic, a service worker, or Angular Native.
- Keep colors on the tokens in `src/styles.scss`. Tailwind reads those tokens; do not add `tailwind.config.js` or `@tailwind` directives.
- One typeface: Archivo, self-hosted from `@fontsource-variable/archivo` with its width axis. Do not add a second face.
- Shared styles in `src/styles.scss` sit in Tailwind's `base` and `components` layers, so utilities can override them. The one exception is the unlayered block for Spartan's `data-slot` parts, which has to win over Helm's utility classes.
- Guest checkout stays on the public path. Do not put a sign-in wall in front of it.
- Do not put payment-provider calls or email sending in browser code.
- Import `ShopButtonImports`, not `HlmButton` alone, wherever a template uses `hlmBtn`.
- Change Spartan's look through the tokens or the unlayered `data-slot` block in `src/styles.scss`; leave `src/app/ui/helm/` as generated.
