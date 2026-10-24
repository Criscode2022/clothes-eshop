# Marlow Application Test Report & Bug Log

This document records the results of running all automated test suites, full end-to-end browser verification via Browser MCP (`@playwright/mcp`), and the fixes and regression tests applied across the **Marlow** ready-to-wear application.

---

## 1. Automated Test & Build Results

| Suite | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Angular Unit, Integration & E2E Specs** | `npm test -- --watch=false` | **PASSED** | **36 test files**, **275 tests passed** (including all new regression tests). |
| **Node Script Tests** | `npm run test:scripts` | **PASSED** | **5 test suites**, **28 tests passed** (`scripts/__tests__/*.spec.mjs`). |
| **Production SSR Build** | `npm run build` | **PASSED** | Built browser + server bundles cleanly (`Initial total: 493.35 kB \| 125.92 kB` transfer size; `dist/angular-neon-agent-template/server/server.mjs`). |

---

## 2. Browser MCP Flow Coverage Summary

All routes and user journeys were exercised against the SSR server (`dist/angular-neon-agent-template/server/server.mjs`) via `@playwright/mcp` in both desktop (`1280×800`) and mobile (`390×844`) viewports:

- **Public Floor & Navigation**:
  - Home floor (`/`): SSR initial render, opening spread carousel (`app-opening-spread`) & pause/play control, editorial feature, category cards, floor filter chips (`All`, `Outerwear`, `Knitwear`, `Trousers`, `Shirts`), product cards (`app-product-card`), color swatch switching, and quick-add size drawer.
  - Category pages (`/category/outerwear`, `/category/shirts`, etc.) and unknown category fallback (`/category/invalid-cat`).
  - Product detail page (`/product/wool-overcoat`, `/product/linen-work-overshirt-9`) and unknown product fallback (`/product/not-a-piece`): color & size selection, stock status note, full-size portrait `<dialog class="viewer">`, stand-in photo behavior for newly created pieces, and mobile sticky `.buy-bar`.
  - Atelier page (`/atelier`).
  - Mobile navigation sheet (`#site-menu` via `.menu-button`).
- **Shopping Bag & Checkout**:
  - Bag slide-over drawer (`app-bag-panel`): item count badge, free-shipping progress bar (`$200` threshold), quantity stepper (`+`/`-`), stock cap enforcement, line removal, and empty bag state.
  - Checkout (`/checkout`): empty bag redirect state, form validation on blur/submit, US shipping (`$8.00` under `$200`, free from `$200`) vs. shop pickup (`$0.00`), payment method availability (`cod` + `bank_transfer` for shipping; `in_store` + `bank_transfer` for pickup), country combobox (`app-country-field`), region `<select>` for US/CA/ES/IT, and Canadian postal code normalization (`k1a0b1` → `K1A 0B1`).
- **Order Confirmation & Sandbox Bank**:
  - Order confirmation (`/order/:reference`): placed status, bank transfer callout, client order cancellation via confirmation dialog (`cancelled` status & stock restoration).
  - Sandbox Bank (`/bank/:reference/:code`): valid signed link (`Authorize the transfer` → `paid` status) and tampered/invalid link (`That transfer link is not valid`).
- **Authentication & Account Flows**:
  - Sign-in & registration (`/sign-in`), forgot password (`/forgot-password`), password reset (`/reset-password?token=...` and `/reset-password?error=INVALID_TOKEN`).
  - Client account (`/account` profile name update, password change, account deletion dialog) and client orders (`/account/orders` search, sort, clear filters).
  - Role guard redirects (`/desk` and `/owner/pieces` → `/not-allowed` for unauthorized roles).
- **Worker & Owner Backoffice**:
  - Worker order queue (`/desk`): status filter chips, expanding order details, advancing shipping fulfillment (`placed` → `preparing` → `shipped` → `delivered`) and pickup fulfillment (`placed` → `preparing` → `ready` → `picked_up`).
  - Worker stock table (`/desk/stock`): low-stock filter (`3 or fewer`), `app-stock-field` stepper & manual count save.
  - Owner backoffice (`/owner`, `/owner/pieces`, `/owner/new`): piece switcher, price editing, adding new color/size variants, and creating a new piece (`Linen Work Overshirt`).
- **Localization (`en` / `es`)**:
  - Language switcher in header across floor, product pages, checkout, order pages, and backoffice.

---

## 3. Bugs Fixed and Verified

### Bug 1: Stray `>` character rendered in every row of the Worker Stock table (`/desk/stock`)
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: Medium (Visual UI defect in every table row)
- **Location**: [`src/app/pages/desk/desk-stock.html`](src/app/pages/desk/desk-stock.html)
- **Fix**: Removed the duplicate trailing `>` character on line 69.
- **Verification**: Browser MCP check confirmed `hasStrayGt: false` and text values like `"In stock"`, `"Only 2 left"` without trailing angle bracket. Added regression test in `shop-routes.spec.ts`.

---

### Bug 2: Missing validation error message & `aria-describedby` for `#variant-stock` on `/owner/pieces`, plus missing integer check on client stock forms
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: High (Accessibility / WCAG violation & silent form failure)
- **Location**:
  - [`src/app/pages/owner/owner-pieces.html`](src/app/pages/owner/owner-pieces.html)
  - [`src/app/pages/owner/owner-pieces.ts`](src/app/pages/owner/owner-pieces.ts)
  - [`src/app/pages/owner/new-piece.ts`](src/app/pages/owner/new-piece.ts)
  - [`src/app/ui/form-rules.ts`](src/app/ui/form-rules.ts)
- **Fix**:
  1. Added `[attr.aria-describedby]="... ? 'variant-stock-error' : null"` and `<p id="variant-stock-error" class="field__error">{{ variantForm.stock().errors()[0]?.message | t }}</p>` to `owner-pieces.html`.
  2. Created shared validator `wholeStock(path.stock)` in `src/app/ui/form-rules.ts` that enforces `Number.isInteger(stock) && stock >= 0`, applied to both `owner-pieces.ts` and `new-piece.ts`.
- **Verification**: Browser MCP verified entering `-1` and `1.5` both immediately show `invalid="true"`, `describedBy="variant-stock-error"`, and `"Stock is a whole number, 0 or more."` without submitting to the server. Added regression tests in `shop-routes.spec.ts`.

---

### Bug 3: Signed-in shopper's name and email not prefilled on `/checkout` after page reload or direct navigation
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: Medium (Broken prefill behavior on SSR load/refresh)
- **Location**: [`src/app/pages/checkout/checkout.ts`](src/app/pages/checkout/checkout.ts)
- **Fix**: Added an `effect()` in `Checkout` constructor that listens to `this.session.current()` and updates `contact.name` and `contact.email` if they are not already filled, preserving any shopper-entered values while gracefully handling late session resolution after hydration.
- **Verification**: Browser MCP verified navigating directly to `/checkout` with an active session token correctly prefills `Avery Cole` and `avery@example.com`. Added regression test in `shop-routes.spec.ts`.

---

### Bug 4: Spanish (`es`) localization defects in `CountryField` (`#ship-country` on `/checkout`)
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: Medium (Broken country search & mixed-language UI in Spanish mode)
- **Location**:
  - [`src/app/shop/countries.ts`](src/app/shop/countries.ts)
  - [`src/app/ui/country-field.ts`](src/app/ui/country-field.ts)
- **Fix**:
  1. Added missing Spanish names (`'Dinamarca'`, `'Finlandia'`, `'Malasia'`, `'Filipinas'`, `'Singapur'`, `'Taiwán'`, `'Tailandia'`, `'Emiratos Árabes Unidos'`) to country aliases in `src/app/shop/countries.ts`.
  2. Updated `countryNamed` in `src/app/shop/countries.ts` to check aliases as well as canonical names and codes.
  3. Bound `[itemToString]="itemToString()"` to `<hlm-combobox>` in `country-field.ts`, translating the canonical country name to the active locale (`translate(locale, name)`) so `#ship-country` displays `"Estados Unidos"` in Spanish and `"United States"` in English.
- **Verification**: Browser MCP verified `#ship-country` displays `"Estados Unidos"` in Spanish, and typing `"Dinamarca"` finds and filters Denmark properly. Added regression tests in `address-rules.spec.ts` and `shop-routes.spec.ts`.

---

### Bug 5: Client-side name and email validation on `/account`, `/sign-in`, and `/forgot-password` does not match project rules (`address-rules.ts`) or server validation
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: Medium (Validation mismatch causing avoidable HTTP 400 errors and inconsistent email acceptance)
- **Location**:
  - [`src/app/ui/form-rules.ts`](src/app/ui/form-rules.ts)
  - [`src/app/pages/account/account.ts`](src/app/pages/account/account.ts)
  - [`src/app/pages/sign-in/sign-in.ts`](src/app/pages/sign-in/sign-in.ts)
  - [`src/app/pages/password/forgot-password.ts`](src/app/pages/password/forgot-password.ts)
  - [`src/app/shop/account-server.ts`](src/app/shop/account-server.ts)
- **Fix**:
  1. Extracted reusable Signal Forms validators `personName(path)` and `emailAddress(path)` in `src/app/ui/form-rules.ts` wrapping `nameProblem()` and `emailProblem()` from `src/app/shop/address-rules.ts`.
  2. Applied `personName` to `account.ts` and `sign-in.ts`, and `emailAddress` to `sign-in.ts` and `forgot-password.ts`.
  3. Updated `handleAccountHttp` (`PATCH /api/account`) to use `nameProblem()` for server consistency.
- **Verification**: Browser MCP verified entering whitespace name `"   "` on `/account` is blocked on the client with `"Enter your full name."`, and dotless emails (`user@localhost`) on `/sign-in` and `/forgot-password` are blocked with `"Enter an email address, like name@example.com."`. Added regression tests in `account-pages.spec.ts` and `account-server.spec.ts`.

---

### Bug 6: Missing Spanish (`es`) translations for several user-facing strings and dynamic patterns
- **Status**: **RESOLVED & VERIFIED**
- **Severity**: Low (Untranslated English strings in Spanish mode)
- **Location**:
  - [`src/app/i18n/parts/shop.ts`](src/app/i18n/parts/shop.ts)
  - [`src/app/i18n/parts/staff.ts`](src/app/i18n/parts/staff.ts)
  - [`src/app/i18n/translate.ts`](src/app/i18n/translate.ts)
- **Fix**:
  1. Added `'The transfer did not go through.': 'La transferencia no se completó.'` to `src/app/i18n/parts/shop.ts`.
  2. Added `'Added from the backoffice.': 'Añadida desde la administración.'` to `src/app/i18n/parts/staff.ts`.
  3. Added `cancelledFail` regex pattern `/^(\S+) could not be cancelled\.$/` (`${order.reference} no se pudo cancelar.`) to `patterned()` in `src/app/i18n/translate.ts`.
- **Verification**: All patterns and entries verified via unit tests in `i18n.spec.ts`.
