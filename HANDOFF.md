# Marlow: session handoff

Written 2026-10-08 at the end of a working session (2026-10-03 to 2026-10-08). It is meant to let you, or a fresh Claude Code session, pick the project up cold on another machine or in another folder. Read sections 1 and 2 first; the rest is reference.

---

## 1. TL;DR

- **What this is:** Marlow, a small ready-to-wear clothes shop. Angular 22 with SSR, an Express server, Tailwind 4 on design tokens, and an optional Neon (Postgres) backend. Three audiences: shoppers (public floor, bag, guest checkout), workers (the desk), and the owner (the backoffice).
- **What happened this session:** a full visual and UX redesign of every screen, done through the project's skills (impeccable, frontend-design, angular-developer, angular-ssr, tailwind-angular, clean-code). The owner chose the **category standard for a quiet-luxury shop**, held to the craft of **COS, Arket, and Toteme**: white ground, black type, one grey ramp, Archivo as the only typeface, and the garment photographs as the only color.
- **Where it is:** merged into `main` and pushed. `main` and `marlow-redesign` both point at `c429694` on `origin` (`git@github.com:Criscode2022/clothes-eshop.git`). The working tree was clean before this file was added.
- **State:** the production build passes, 49 of 49 tests pass, the server renders the public pages, axe reports zero accessibility violations across 21 page states, and the impeccable finish review ended at "ship" for its five scored fixes.
- **Biggest gotcha:** with a `.env` that sets `DATABASE_URL`, the dev and production servers read and **write** your Neon branch (orders, prices, stock). For any testing, run with `DATABASE_URL=` (empty) to stay in memory. Details in section 2.5.

---

## 2. Resume at a new location

### 2.1 Get the code

```sh
# New machine or new folder
git clone git@github.com:Criscode2022/clothes-eshop.git
cd clothes-eshop
git switch main            # main holds everything; marlow-redesign is the same commit

# Existing clone elsewhere
git fetch origin && git switch main && git pull --ff-only
```

### 2.2 Requirements

| Tool          | Version used this session | Notes                                               |
| ------------- | ------------------------- | --------------------------------------------------- |
| Node          | v24.21.0                  | Node 24 has built-in `fetch` and `WebSocket`.       |
| npm           | 11.19.0                   | Pinned in `package.json` as `packageManager`.       |
| Angular       | 22.2.1 (core and CLI)     | `@angular/build` with Vitest 5.0.3 and jsdom 30.    |
| TypeScript    | 6.0.3                     | Strict by default; never turn it off.               |
| Tailwind      | 4.3.3 (range `^4.1.12`)   | Via `@tailwindcss/postcss`, no config file.         |
| Google Chrome | any recent                | Only for screenshots and axe checks; see section 9. |

### 2.3 Install

```sh
npm ci
```

npm may warn about blocked install scripts (`core-js` postinstall). That is harmless: `allowScripts` in `package.json` lists the scripts the project actually needs.

### 2.4 Recreate `.env` (optional)

`.env` is gitignored and **was not pushed**. It exists only in the original folder on the USB volume (`/Volumes/Usb-repos/clothes-eshop/.env`). It holds three keys:

| Key                 | Read by                                                             | Secret?                                                 |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`      | the Node server only (`src/server.ts`, `src/app/shop/neon-book.ts`) | **Yes.** Never commit it, never put it in browser code. |
| `NEON_AUTH_URL`     | the server                                                          | No; the same value is in `src/app/shop/neon-public.ts`. |
| `NEON_DATA_API_URL` | the server (`neon-adopt.ts`)                                        | No; the same value is in `src/app/shop/neon-public.ts`. |

You do **not** need `.env` for UI work. Without `DATABASE_URL` the whole shop runs in memory with the seeded catalog, and the tests always run that way. To get the real values, copy the file securely from the old location, or get the connection string from the Neon console (or the Neon MCP server, after OAuth). Project rule: ask before writing a connection string anywhere, and only ever into the gitignored `.env`.

### 2.5 Run it

```sh
# Development server (SSR in dev). WARNING: reads .env, so with DATABASE_URL set it syncs with Neon.
DATABASE_URL= npm start                      # safe: in-memory shop on http://localhost:4200

# Production build, served locally in memory (what this session used for every check)
npm run build
DATABASE_URL= NG_ALLOWED_HOSTS=localhost PORT=4000 npm run serve:ssr:angular-neon-agent-template
# then open http://localhost:4000
```

- `NG_ALLOWED_HOSTS=localhost` is required locally, because `angular.json` only allows `marlow.shop`. Never set allowed hosts to `*`.
- An empty `DATABASE_URL=` keeps the server in memory: `loadLocalEnv()` in `src/server.ts` never overrides a variable that is already set, and `shopDatabaseConfigured()` treats an empty string as "no database".
- With `DATABASE_URL` set, the server pulls the Neon branch into the shop book before every request, and pushes successful orders, prices, stock changes, and new pieces back. Don't place test orders against it.

### 2.6 Verify

```sh
npm run build          # must pass (budgets: initial 500 kB warn / 1 MB error; component styles 4 kB / 8 kB)
npm test               # Vitest via ng test: 10 files, 49 tests
npm run test:scripts   # only needed if you change anything in scripts/
```

The Angular CLI MCP server (`.mcp.json`) gives Claude `run_target` for `build` and `test`; the project rules prefer it over shell commands.

### 2.7 Demo accounts ("floor accounts")

Shared password: `marlow-floor`. These are demo people, not secrets. On the sign-in page, each one is a one-tap button.

| Person       | Email                | Role   | Lands on          |
| ------------ | -------------------- | ------ | ----------------- |
| Avery Cole   | `avery@marlow.shop`  | client | `/account/orders` |
| Noah Pell    | `noah@marlow.shop`   | client | `/account/orders` |
| Jordan Hale  | `jordan@marlow.shop` | worker | `/desk`           |
| Sloan Marlow | `sloan@marlow.shop`  | owner  | `/owner`          |

Shoppers can also create a real Neon Auth account (needs network). Its role comes from `app_private` through `current_shop_role`, never from a field the person can edit.

### 2.8 Resuming with Claude Code

- `CLAUDE.md` loads automatically and pulls in `AGENTS.md`, `PROJECT.md`, and `APP.md`. Then read this file, `PRODUCT.md`, and `DESIGN.md`.
- **Claude's memory does not travel.** Memory is stored per path on the old machine (`~/.claude/projects/-Volumes-Usb-repos-clothes-eshop/memory/`). It held one preference, restated here: _for big changes, create a new branch (with a checkpoint commit if the tree is dirty), commit the work there, and ask before pushing._
- The impeccable skill's context loader is `.claude/skills/impeccable/scripts/impeccable context`. It reads `PRODUCT.md`, `DESIGN.md`, and the surface briefs in `.impeccable/surfaces/`, so design work picks up the chosen direction automatically.
- A good first prompt in the new session: _"Read HANDOFF.md, PRODUCT.md, DESIGN.md and APP.md, then run the build and tests and tell me the state before we continue."_

---

## 3. Repository state at handoff

| Ref       | Commit                                                               | Meaning                                                                                                                |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `88e61a5` | Initial commit                                                       | The Angular + Neon agent template.                                                                                     |
| `13b3ecf` | Checkpoint the Marlow shop before the redesign                       | The working Marlow app as it existed before this session (it had never been committed).                                |
| `51b8494` | Redesign Marlow as a quiet-luxury shop with a faster path to the bag | The redesign: about 110 files.                                                                                         |
| `c429694` | Put the shipping band and staff tables in distinct landmarks         | The axe fixes. `main`, `marlow-redesign`, and both `origin` branches point here.                                       |
| (none)    | —                                                                    | `HANDOFF.md` itself was left uncommitted at the end of the session, so it exists only in the folder it was written in. |

- Remote: `origin` = `git@github.com:Criscode2022/clothes-eshop.git`. No tags.
- `main` was fast-forwarded to the redesign (no merge commit). `marlow-redesign` is kept for reference and can be deleted locally and on GitHub whenever you like.
- The local branch `Criscode2022/main-2` was deleted at your request. It pointed at the initial commit, was never pushed, and its Orca worktree folder (`/Users/cristian/orca/workspaces/clothes-eshop/main-2`) no longer existed, so only a stale worktree record was pruned.
- To see exactly what the redesign changed: `git diff 13b3ecf c429694 --stat`, or `git diff 13b3ecf c429694 -- src/app/pages/checkout`.

---

## 4. What Marlow is (product truth)

Full record in `PRODUCT.md` (confirmed with you) and app rules in `APP.md`. Summary:

- **Shoppers** browse eight pieces in four categories (outerwear, knitwear, trousers, shirts), choose color and size, build a bag, and check out. An account is optional; a guest order is stored without a client id, and a signed-in client sees only their own orders. The presentation is unisex (dress forms and flat lays, no models).
- **Workers** use the desk: orders by fulfillment state (placed → picking → ready → completed; cancel until completed) and on-hand stock. No prices, no catalog administration.
- **The owner** uses the backoffice: every order, prices, sizes and colors with stock, and new pieces.
- **Money:** prices are integer US cents shown as `$420.00`. Shipping is $8.00, free when the pieces total at least $200.00. The total is the lines plus shipping.
- **Payment** records one of three methods (pay at the shop, bank transfer, cash when it arrives). The shop never asks for or stores a card number and never calls a payment provider.
- **Evidence on hand:** eight photographs (800×1200) in `public/garments/`, plus cloth, care, and fit notes in `src/app/shop/cloth.ts`. Never invent reviews, testimonials, press, customer counts, an address, opening hours, or sustainability claims.
- **Product principles:** the pieces lead; honest specifics over persuasion; never block the purchase; staff screens are working tools; one shop, three doors.

---

## 5. The redesign: decisions and why

### 5.1 How it was decided

1. **Skills loaded,** as `PROJECT.md` requires: `frontend-design`, `impeccable`, `angular-developer`, `angular-ssr` (the app type is `ssr`), `tailwind-angular` (Tailwind is installed), and `clean-code`. Angular's `get_best_practices` was read through the Angular CLI MCP server.
2. **Your answers** (one structured round):
   - the product read is right and the shop is **unisex**;
   - improve **all four**: desire, speed to bag, mobile, staff screens;
   - **keep nothing** of the old look (magenta accent, Newsreader serif, and copy voice all released);
   - checkpoint on a new branch and commit there.
3. **Impeccable `init`** wrote `PRODUCT.md`. **`new-work`** listed seven grounded visual worlds from the clothing trade. `concept-seed` (key **`179a4410`**) assigned "The Care Label" (garment labels and laundry care symbols, on a mauve-plaster page), with "The Showroom Rail" as the model's pick and six declined catalog challengers.
4. The decision page closed unanswered, so the same choice was put to you in Claude Code. **You chose "The category standard."** Following impeccable's rule for that exit, you named the craft bar: **COS, Arket, Toteme**. That preference is recorded in `PRODUCT.md` (Brand Commitments) and `APP.md`.
5. Build path: **code-led** (no image generation was available, so there were no comps). The direction contract lives in the surface briefs (`.impeccable/surfaces/`). The storefront brief's first-viewport promise was amended after the finish review: the spread now fills about half the height, not two thirds, so the first products show above the fold on a laptop.

### 5.2 The design system (full spec in `DESIGN.md` and `.impeccable/design.json`)

- **North star:** "The White Room". The page is white, black, and grey; only the photographs (mauve walls, linen, camel, ink) carry color.
- **Colors (light):** canvas `#ffffff`, surface `#f5f5f4`, surface-strong `#ebebea`, text and accent `#000000`, muted `#61615e`, border `#e3e3e1`, field border `#8c8c88`, danger `#b42318`, notice `#8a4b12`, positive `#276738`, band `#000000` with `#ffffff` text. Every pair meets WCAG AA. Dark mode (`prefers-color-scheme: dark`) swaps to canvas `#121212`, surface `#1c1c1b`/`#262625`, text `#f4f4f2`, muted `#a8a8a3`, and a dark grey band `#262625`.
- **Type:** Archivo only (`@fontsource-variable/archivo`, width axis 62–125%, weight 100–900). Wordmark at 125% width, 620 weight, 0.16em tracking, uppercase (the only uppercase anywhere). Display `clamp(2rem, 1.35rem + 2.2vw, 3.25rem)` at 450 weight. Headlines 1.625rem at 500. Body 1rem / 1.55. Labels 0.875rem. Staff tables use 84% width with tabular figures.
- **Shape and depth:** square corners everywhere (radius 0); only the bag count pill and color swatches are round. Flat surfaces; the only shadow is the bag notice toast. Sheets use a scrim (36% black, 60% in dark).
- **Motion:** the home spread settles once on load (scale 1.06 → 1 over 1.8s). A piece's photo morphs from the floor to its page through the View Transitions API. The bag and menu sheets slide in with `@starting-style`. A line just added to the bag flashes once. Everything collapses under `prefers-reduced-motion`.
- **Named rules:** Photograph Carries the Color, Black Is the Action, One Family, Figures Line Up, Flat Floor.

---

## 6. Architecture map

### 6.1 Config and routing

- `src/app/app.config.ts`: `provideRouter` with `withComponentInputBinding()`, `withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })`, and `withViewTransitions({ skipInitialTransition: true })`; `provideHttpClient(withFetch())`; `provideClientHydration()`.
- `src/app/app.config.server.ts`: SSR providers, plus `CATALOG_SOURCE` pointed at the live shop book.
- `angular.json` global styles, in order: `node_modules/@fontsource-variable/archivo/wdth.css`, `src/tailwind.css`, `src/styles.scss`. `outputMode: server`, `security.allowedHosts: ["marlow.shop"]`.

| Path                | Component                                                                            | Render | Guard         |
| ------------------- | ------------------------------------------------------------------------------------ | ------ | ------------- |
| `/`                 | `pages/catalog` (floor: spread, intro, grid)                                         | Server |               |
| `/category/:slug`   | `pages/catalog` (split layout)                                                       | Server |               |
| `/product/:id`      | `pages/product`                                                                      | Server |               |
| `/atelier`          | `pages/atelier`                                                                      | Server |               |
| `/bag`              | `pages/bag`                                                                          | Client |               |
| `/checkout`         | `pages/checkout` (one page)                                                          | Client |               |
| `/order/:reference` | `pages/order`                                                                        | Client |               |
| `/sign-in`          | `pages/sign-in`                                                                      | Client |               |
| `/account/orders`   | `pages/account/account-orders`                                                       | Client | `clientGuard` |
| `/desk`             | `pages/desk/desk` → child `''` = `pages/staff/order-queue` (heading "Orders")        | Client | `deskGuard`   |
| `/desk/stock`       | `pages/desk/desk-stock`                                                              | Client | `deskGuard`   |
| `/owner`            | `pages/owner/owner` → child `''` = `pages/staff/order-queue` (heading "Every order") | Client | `ownerGuard`  |
| `/owner/pieces`     | `pages/owner/owner-pieces` (`?piece=<id>` selects)                                   | Client | `ownerGuard`  |
| `/owner/new`        | `pages/owner/new-piece`                                                              | Client | `ownerGuard`  |
| `/not-allowed`      | `pages/not-allowed`                                                                  | Client |               |
| `**`                | redirects to `/`                                                                     | Client |               |

### 6.2 Layout (`src/app/layout/`)

- `shell.*`: skip link, the shipping band (`<aside aria-label="Shipping and payment">`), header, `<main>`, footer, bag panel, and a toast region (`role="status"`) for bag notices. After the first render it starts bag persistence; after each later navigation it clears the notice and focuses `<main>` (`preventScroll`).
- `site-header/*`: sticky header with the wordmark, department nav (`aria-label="Main"`), Atelier, account links by role (Orders, Desk, Backoffice), Sign in or Sign out (sign-out navigates home), and the bag button with its count pill. On phones: a menu button, the centered wordmark, and a bag icon; the menu is a native `<dialog>` sheet sliding in from the left.
- `bag-panel/*`: the bag drawer, a native modal `<dialog>` sliding in from the right. An `afterRenderEffect` opens and closes it from `BagDrawer.isOpen()`. It closes synchronously on `NavigationStart`, so focus returns to the bag button before the shell moves focus to `<main>`. It shows the "Added …" line (also wired to `aria-describedby`), the lines, the free-shipping meter, totals, Check out, and View bag.
- `site-footer.ts`: wordmark, one `<nav aria-label="Footer">` with Shop, Help, and Account groups, and the terms line.

### 6.3 Shared UI (`src/app/ui/`)

| File                   | What it is                                                                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon.ts`              | Authored line icons (bag, close, plus, minus, menu, check, chevron-down, copy): 1.5px stroke, `currentColor`, `aria-hidden`.                                                                                                                                |
| `piece-photo.ts`       | `NgOptimizedImage` for seeded pieces, or a stand-in panel (swatch plus "No photograph yet") for owner-added pieces; takes an optional `view-transition-name`.                                                                                               |
| `product-card/*`       | Grid card: 2:3 photo, a square "+" quick-add toggle, and a size panel that slides up over the photo (also on hover where hover exists), then name, price, and color dots. Escape closes it. Adding a size moves focus to the toggle, then opens the drawer. |
| `bag-lines/*`          | Bag lines with photo, name link, color and size, unit price, quantity stepper (min 1, max stock), and Remove. Lines animate in and out with `animate.enter` and `animate.leave`.                                                                            |
| `quantity-stepper.ts`  | Minus, count, plus, with labelled buttons.                                                                                                                                                                                                                  |
| `free-shipping.ts`     | "Add $X more for free shipping" or "Shipping is free…", over a 2px meter.                                                                                                                                                                                   |
| `order-totals.ts`      | Subtotal, Shipping (shows "Free" at $0), Total.                                                                                                                                                                                                             |
| `fulfillment-badge.ts` | A dot plus the state name.                                                                                                                                                                                                                                  |
| `order-track.ts`       | The Placed → Picking → Ready → Completed track, or a cancelled note.                                                                                                                                                                                        |
| `text-field.ts`        | Labelled Signal Forms input with hint, error, `aria-invalid`, and `aria-describedby`. Its id input is **`inputId`** (not `id`, which would land on the host). String fields only; number fields are written inline with a static `type="number"`.           |
| `dialog.ts`            | `openModal`, `closeModal`, and `isBackdropClick`, with an open-attribute fallback because jsdom has no `showModal()`.                                                                                                                                       |

### 6.4 Pages (`src/app/pages/`)

- `catalog/*`: the floor (`/`): a full-bleed spread of three photos (oxford shirt, overcoat, field jacket; one photo on phones), the intro ("A small ready-to-wear floor" plus terms), category filter chips with counts, and a grid of 2, 3, or 4 columns. Category pages use a split layout (title, fit note, and filters sticky on the left; two-up grid on the right). The filters and grid are shared through `ng-template`.
- `product/*`: on desktop, the photo is sized to the window height beside a sticky panel: breadcrumb, name, price, summary, color radios, size radios ("Choose a size." or the stock note), Add to bag, assurances, and `<details>` for Cloth and care and for Fit. Below sits "More from the floor" (four pieces). On phones the photo runs edge to edge and a fixed buy bar appears once the main button is off screen.
- `bag/*`: the full bag page with a sticky summary.
- `checkout/*`: one page with Contact, Delivery, and Payment sections, a single Place order button, and a summary (sticky aside on desktop, a collapsible bar with the total on phones).
- `order/*`: thank-you (only right after checkout), reference with a copy button, state badge, track, lines, totals, and payment, delivery, and contact facts.
- `sign-in/*`: two panels (sign in, create account) plus one-tap floor accounts.
- `account/*`: the client's orders, newest first, with state badges.
- `atelier/*`: the editorial page (lead photo; cloth and care; shipping and payment (`#shipping`); how an order leaves (`#orders`); the floor).
- `not-allowed/*`: "This part of the shop is closed to you." The tests rely on that phrase.
- `staff/*`: `staff-header.ts` (title, lede, link tabs), `order-queue.*` (filters, search, table, details, actions; used by both desk and backoffice), `stock-field.ts` (inline stock editor).
- `desk/*`, `owner/*`: area layouts plus `desk-stock`, `owner-pieces`, and `new-piece`.

### 6.5 Domain and services (`src/app/shop/`)

New this session:

| File                 | Responsibility                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bag-drawer.ts`      | `BagDrawer` service: `isOpen`, `justAdded`, `add(productId, variantId)` (adds, and opens on success), `open()`, `close()`.                                   |
| `bag-persistence.ts` | `BagPersistence.start(storage)`: restores the saved bag, then saves on every change through an `effect`. Called only in the browser, after the first render. |
| `bag-storage.ts`     | `readStoredBag` and `writeStoredBag` under the key **`marlow.bag`**: drops unknown sizes, caps quantities at stock, ignores garbage.                         |
| `stock.ts`           | `stockState` (`sold-out`, `low` at 2 or fewer, `in-stock`) and `stockNote` ("Sold out", "Only N left", "In stock").                                          |
| `order-queue.ts`     | Desk views (`open` plus every state), `QUEUE_VIEWS`, `queueCounts`, `ordersInView` (filter, search, newest first), `newestOrdersFirst`.                      |

Changed this session:

- `bag.ts`: `add()` now returns an `AddOutcome` (`{ added: true, line }` or `{ added: false, reason }`; a refusal also sets the notice). Added `quote` (computed), `remove()`, and `restore()`. There is no longer a success notice.
- `checkout.ts`: removed `CHECKOUT_STEPS` and `CheckoutStep`; added `fulfillmentName`, `fulfillmentTrack`, `TrackStep`, `TrackStatus`. `fulfillmentActions` is unchanged ("Start picking", "Mark ready", "Complete", "Cancel").
- `money.ts`: added `freeShippingProgress`, `centsFromDollars` (rounds to whole cents), `dollarsFromCents`.
- `catalog.ts`: added `variantsByColor` and `isSoldOut`.
- `cloth.ts`: added `morePieces` (same category first, then the rest of the floor, up to four).
- `catalog-store.ts`: added `replaceAll(products)`.
- `shop-client.ts`: `loadCatalog()` now also refreshes `CatalogStore`, so the desk and backoffice always show the server's current stock and prices.

Unchanged and important: `access.ts` (who may do what), `cart.ts` (line math, `StockLimitError`), `order-book.ts` (in-memory shop book shared through a process symbol), `shop-server.ts` (the API handler and floor accounts), `neon-book.ts` (Neon pull and push), `neon-adopt.ts` (turns a Neon Auth token into a shop session), `neon-browser.ts` (lazy Neon Auth client), `staff.guard.ts`, `shop-session.ts`, `money.pipe.ts`.

### 6.6 Server and API (`src/server.ts`, `src/app/shop/shop-server.ts`)

Express serves `/api/*`, static files from `browser/`, and SSR for everything else. Endpoints:

| Method | Path                           | Auth               | Does                                                                       |
| ------ | ------------------------------ | ------------------ | -------------------------------------------------------------------------- |
| POST   | `/api/session`                 | none               | Floor-account sign-in; returns `{ token, actor }`.                         |
| POST   | `/api/session/neon`            | Neon token in body | Adopts a Neon Auth session (role from `current_shop_role`).                |
| DELETE | `/api/session`                 | Bearer             | Signs out.                                                                 |
| GET    | `/api/catalog`                 | none               | The floor.                                                                 |
| POST   | `/api/orders`                  | optional Bearer    | Places an order (guest or client); refuses card fields.                    |
| GET    | `/api/orders`                  | Bearer             | Orders visible to the actor.                                               |
| GET    | `/api/orders/:ref`             | optional           | One order (guest orders by reference; client orders need that client).     |
| POST   | `/api/orders/:ref/fulfillment` | worker or owner    | Moves fulfillment.                                                         |
| POST   | `/api/variants/:id/stock`      | worker or owner    | Sets on-hand stock.                                                        |
| POST   | `/api/products/:id/price`      | owner              | Sets the price, in cents.                                                  |
| POST   | `/api/products/:id/variants`   | owner              | Adds a size or color.                                                      |
| POST   | `/api/products`                | owner              | Creates a piece (name, category, priceCents, summary, size, color, stock). |

### 6.7 Styles

- `src/styles.scss` holds the tokens on `:root` (light) and under `prefers-color-scheme: dark`, then `@layer base` (body, headings, links in running text keep their underline, themed focus, selection, scrollbars, caret) and `@layer components` (`.page`, `.wordmark`, `.button` and its variants, `.text-button`, `.icon-button`, `.field` and `.input`, `.choice`, `.size-option`, `.swatch`, `.status-badge`, `.data-table`, `.notice`, `.sheet`). These layers merge into Tailwind's, so utilities still win. The view-transition rules, keyframes (`settle`, `flash`, `rise-in`, `fade-out`), and the reduced-motion override live there too.
- `src/tailwind.css` is `@import 'tailwindcss'` plus `@theme inline reference`, which registers the tokens as Tailwind values (`bg-surface`, `text-text-muted`, `text-ui`, and so on). No `tailwind.config.js`, no `@tailwind` directives.

---

## 7. Behaviors worth knowing

- **Quick add:** "+" on a card opens its sizes; choosing one adds a single item and opens the drawer on that line. Sold-out sizes are disabled and struck through; a piece with nothing left shows "Sold out" instead of "+".
- **Size choice:** the product page never guesses a size, unless only one size is left in the chosen color. Pressing Add to bag without a size shows "Choose a size to add it to your bag." and focuses the size group.
- **Bag:** kept in `localStorage` (`marlow.bag`) and restored after the first render, so SSR hydration matches. It is capped at current stock when it comes back. Quantity can't go above stock; the lowest quantity is 1 (Remove deletes the line).
- **Checkout:** the contact name and email are prefilled for a signed-in person. Invalid submits mark every field, show inline errors, and focus the first invalid field. A server error shows `role="alert"`, gets focus, and keeps everything typed. Success clears the bag and goes to `/order/:reference` with router state `{ placed: true }`, which shows the thank-you line.
- **Desk:** views Open (placed + picking + ready) and each state, with counts; search by reference or client name; newest first. The chevron opens a picking list (lines, ship-to, contact). The next step is the black button; Cancel asks for confirmation inline.
- **Stock editor:** the minus and plus buttons or typing change a draft; Save is enabled only when the draft differs; "Saved" or an error shows inline. A save updates the floor everywhere.
- **Backoffice pieces:** the list on the left links to `?piece=<id>`. Price is typed in dollars and stored as `Math.round(dollars × 100)` cents. Status messages reset only when a different piece is selected.
- **New piece:** after creating, it opens `/owner/pieces?piece=<new id>`. Owner-added pieces have no photograph and no cloth or care notes (the API has no fields for them yet).

---

## 8. Tests

`npm test`: 10 spec files, **49 tests**, all passing at `c429694`.

| File                             | Tests | Covers                                                                                                                                                              |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.spec.ts`                    | 3     | Floor renders (h1, 8 cards, prices, title); a category page with its fit note; unknown URLs redirect to `/`.                                                        |
| `layout/shell.spec.ts`           | 6     | Main landmark; shipping band in a labelled landmark; current nav item; skip link focus; focus after navigation; bag opens from the header and closes on navigation. |
| `shop/bag.spec.ts`               | 4     | Drawer opens on add; refusal keeps it closed with a reason; closing forgets the highlight; persistence restores and saves.                                          |
| `shop/order-queue.spec.ts`       | 6     | Queue counts; open orders newest first; `newestOrdersFirst`; search; fulfillment track; cancelled has no track.                                                     |
| `shop/shop-floor.spec.ts`        | 8     | Stock states; sizes by color; sold out; free-shipping meter; dollars to cents; saved bag (capping, garbage, round trip).                                            |
| `shop/shop-cloth.spec.ts`        | 4     | Cloth and related pieces; `morePieces`; Neon row mapping (2).                                                                                                       |
| `shop/shop-domain.spec.ts`       | 7     | Pre-existing: catalog, bag and checkout rules, staff powers, server entry.                                                                                          |
| `shop/shop-migration.spec.ts`    | 3     | Pre-existing: RLS and grants in the SQL migrations.                                                                                                                 |
| `shop/shop-presentation.spec.ts` | 3     | Tailwind v4 setup, SSR, no Ionic or native; Archivo self-hosted; motion and reduced motion.                                                                         |
| `shop/shop-routes.spec.ts`       | 5     | Guest checkout end to end; incomplete checkout keeps input and flags fields; quick add from the floor; size required; staff access rules.                           |

Testing notes:

- `shop-routes.spec.ts` stubs `/api/*` with an `HttpInterceptorFn` that calls `handleShopHttp` directly, so routes run against the real in-memory shop book (`resetShopServer()` in `beforeEach`).
- Specs that render the shell call `localStorage.clear()` first, because the bag persists.
- jsdom has no `HTMLDialogElement.showModal()`; `ui/dialog.ts` falls back to the `open` attribute, and tests assert `hasAttribute('open')`.
- Every card's size buttons are always in the DOM (hidden with CSS), so scope selectors to a card, e.g. `#sizes-oxford-shirt button[aria-label="Add M to bag"]`.

---

## 9. Verification performed this session

- **Build:** production build passes with no budget warnings. Initial bundle 404.4 kB raw / 112.2 kB transfer; lazy page chunks are 3–14 kB each. The one large lazy chunk (`index`, 440 kB raw / 87 kB transfer) is the Neon Auth client (better-auth), which `neon-browser.ts` loads only when someone signs in or signs up with Neon.
- **SSR:** `curl` of `/` and `/product/...` returned fully rendered HTML. No hydration errors (`NG05xx`) or console errors in any captured state.
- **Visual inspection:** two batched rounds plus a verdict round, driving headless Chrome through the DevTools protocol at 1440×900, 1280×800, and 390×844 (2x), in light and dark, through every flow: quick add → drawer, product → bag → checkout → order, sign-in → desk (move an order, open details, stock) → backoffice (pieces, new piece errors), menu, atelier. The scripts lived in the session scratchpad and are gone; ask Claude to recreate them if needed (Node 24 + Chrome, no packages). The last `desktop.png` and `mobile.png` are in `.impeccable/review/` (gitignored, so only in the original folder).
- **Impeccable detector:** two findings, both false positives (it reads `ngSrc` templates as images without `src`).
- **Finish review (impeccable):** run in-thread rather than as a separate agent, since agents are only started on request. Disposition "fix" with five items: grid top above the fold, a banned side stripe, a misplaced legend, phone summary spacing, a band above the phone product photo. All five fixed and scored resolved; the verdict pass ended at **"ship"**, covering those five fixes.
- **Accessibility:** axe-core 4.13.0 (WCAG 2.0/2.1/2.2 A and AA plus best practice) over 21 states, light and dark, desktop and phone. After the landmark fixes in `c429694`: **zero violations**.
- **Provenance:** the eight garment photos carry an embedded origin note ("pre-existing … source not recorded …"); pixels are byte-identical to before. Check with `.claude/skills/impeccable/scripts/impeccable embed-prompt --scan public/garments`.

---

## 10. Known limitations and gotchas

- **Neon writes:** see section 2.5. Use `DATABASE_URL=` for anything exploratory.
- **Owner-added pieces** have no photo, composition, or care fields (`POST /api/products` doesn't accept them), so their page shows only the fit note. The floor copy ("Every piece names its cloth…") assumes the owner adds notes.
- **The price field shows `420`**, not `420.00` (native number input). Values are still exact.
- **Images are 800×1200 with no `srcset`** (there's no image loader), so large retina screens get slight softness on the hero.
- **Headless Chrome at 1x** once drew stray marks over some glyphs on the desk header; it didn't reproduce at 2x. It's a renderer glitch, not a CSS bug.
- **Formatting:** only files the redesign touched were run through Prettier. Pre-existing files such as `src/server.ts`, `order-book.ts`, `neon-book.ts`, and `shop-server.ts` still fail `prettier --check`, by choice; reformat them in a separate commit if wanted.
- **Template-owned files:** `npm run update-from-template` owns `.agents/skills/`, `.claude/skills/`, `third_party/`, `templates/`, `scripts/`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `PROJECT.md`, `SKILLS.lock.md`, `skills-lock.json`, `.mcp.json`, `.vscode/mcp.json`, `.vscode/extensions.json`, `.cursor/`, `.antigravity/`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.editorconfig`. Put app-specific rules in `APP.md`; that's why `.impeccable/` has its own `.gitignore`.
- **`PROJECT.md`'s code map** still mentions the template's `pages/home` and `features/notes`, which Marlow replaced. It's template-owned, so `APP.md` and this file are authoritative for Marlow.

---

## 11. Suggested next steps (not committed to)

1. Add composition and care to the new-piece form, `POST /api/products`, `order-book.ts`, and the Neon push (the `002` migration already has the columns).
2. Photo upload for owner-added pieces. This needs storage and a server route; never put credentials in the browser.
3. End-to-end tests (Playwright) for the guest checkout and staff flows, plus automated axe checks in CI.
4. A full-screen photo view on the product page (the finish review's one unused category device).
5. Responsive images through an `NgOptimizedImage` loader, if higher-resolution photos arrive.
6. A deployment to a Node host (the static output alone can't serve SSR or `/api`), with `marlow.shop` as the allowed host.
7. Optional cleanup: delete `marlow-redesign` (local and remote) once you no longer need it; run Prettier over the pre-existing files in its own commit.

---

## 12. Project rules cheat sheet

From `CLAUDE.md` → `AGENTS.md`, `PROJECT.md`, `APP.md`:

- Angular 22: standalone components (never `standalone: true`), signals, `input()`/`output()`/`model()`, `computed`/`linkedSignal`, native control flow, `inject()`, `@Service()` for new singletons, host bindings in `host`, no `ngClass`/`ngStyle`, no `CommonModule`, `NgOptimizedImage` for static images, Signal Forms for new forms. OnPush is the default.
- Must pass AXE and WCAG AA (focus management, contrast, ARIA).
- Load the skills before work (`angular-developer`, the app-type skill `angular-ssr`, `frontend-design` then `impeccable` for UI, `tailwind-angular`, `clean-code` for every change). Call `get_best_practices` through the Angular CLI MCP server before writing Angular code.
- No Ionic, service worker, or Angular Native. Colors stay on the tokens in `src/styles.scss`. One typeface (Archivo).
- Guest checkout stays public, with no sign-in wall. No payment-provider calls or email sending in browser code. No card numbers anywhere.
- Neon: OAuth through the Neon MCP server only; never invent or commit a connection string; no destructive SQL unless explicitly asked; prefer migration tools.
- Done means: build passes, tests pass with tests for changed behavior, the SSR checks pass, `test:scripts` passes if `scripts/` changed, and no secrets in tracked files.

---

## 13. Session timeline

1. Read the project, rules, and skills; sampled the photos' colors (mauve plaster about `#5c525b`, grey linen).
2. Interview round (unisex; all four goals; keep nothing; checkpoint on a branch). Checkpoint commit `13b3ecf` on `marlow-redesign`.
3. Wrote `PRODUCT.md` (impeccable init). Direction round: seed `179a4410` (The Care Label assigned; The Showroom Rail as pick; six challengers declined). You chose the category standard, with COS, Arket, and Toteme as benchmarks.
4. Surface briefs written (storefront: Persuade; task surfaces: Operate).
5. Test-first domain work (stock, money, saved bag, drawer, persistence, queue, track), then the design system, UI kit, layout, all pages, the staff areas, and routes.
6. Build and tests green, then visual round 1 (about 15 fixes) and round 2 (3 more), then the detector, the finish review (5 fixes), and the verdict ("ship").
7. Photo provenance embedded; `DESIGN.md` and `.impeccable/design.json` written; `APP.md` updated. Commit `51b8494`.
8. axe pass found 2 moderate issues; fixed in commit `c429694`; zero violations after.
9. Fast-forwarded `main`, pushed `main` and `marlow-redesign`, deleted the stale local branch `Criscode2022/main-2`.
10. Wrote this handoff.

---

## Appendix: key files to open first

| File                                               | Why                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `HANDOFF.md`                                       | This file.                                                         |
| `APP.md`                                           | App-specific rules and decisions (wins over `PROJECT.md`).         |
| `PRODUCT.md`                                       | Product truth (users, purpose, constraints, evidence).             |
| `DESIGN.md`                                        | Visual system: tokens, type, components, do's and don'ts.          |
| `.impeccable/surfaces/*.md`                        | Direction contract and briefs for the storefront and task screens. |
| `src/styles.scss`                                  | Tokens and shared component styles.                                |
| `src/app/app.routes.ts` and `app.routes.server.ts` | Routes and render modes.                                           |
| `src/app/shop/`                                    | Domain rules and services.                                         |
| `src/server.ts`                                    | Express server, API wiring, Neon sync, `.env` loading.             |
