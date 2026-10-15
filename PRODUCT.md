# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Shoppers.** Anyone shopping for considered everyday clothes. The pieces are shown on dress forms and in flat lays, not on models, so the shop addresses no particular gender. They browse the floor, choose a color and size, build a bag, and check out. Most arrive as guests. An account only keeps orders under their name.
- **Shop workers.** People on the shop floor and in the workroom who use the desk (`/desk`) through the day. They move orders through fulfillment and correct on-hand stock. They cannot change prices or administer the catalog.
- **The owner.** Runs the backoffice (`/owner`): sets prices, adds sizes and colors with stock, creates new pieces, and sees every order.

## Product Purpose

Marlow sells a small ready-to-wear collection online and from its own shop floor. The redesign must improve four things the owner named, all equally: desire (pieces from $89 to $420 should look worth their price), speed from browsing to bag to a placed order, shopping on a phone, and the speed of the staff screens.

## Positioning

The floor is the whole collection: no drops, no waiting list, no endless catalog. Each piece names its cloth, how to care for it, and how it fits, in plain words. Payment is a method the shop records (at the shop, bank transfer, or cash when the parcel arrives), never a card number. Anyone can check out as a guest.

## Operating Context

- Categories: outerwear, knitwear, trousers, shirts. Each piece has size and color variants, and each variant has its own stock. A bag line cannot exceed that stock.
- Prices are US dollars, stored as integer cents and shown as `$420.00`. Shipping is $8.00, and free when the pieces total at least $200.00.
- Checkout collects contact details, how the order reaches the client (shipped to an address, or picked up at the shop for free), and a payment method that fits it, and shows what the order will cost before it is placed. Paying at the shop is only for an order picked up there; cash when it arrives only for a parcel.
- Fulfillment: a parcel goes Order placed, Being prepared, On its way, Delivered; an order to pick up goes Order placed, Being prepared, Ready to pick up, Picked up. The client gets an email when the parcel leaves and when the order is ready to pick up. An order can be cancelled until it leaves the shop, or until it is picked up.
- The shop has a physical floor where shoppers can pay.

## Capabilities and Constraints

- Angular 22 with SSR. The public catalog, product pages, and `/atelier` render on the server. Bag, checkout, sign-in, account, desk, and backoffice render in the browser.
- Styling is Tailwind CSS 4 reading the tokens in `src/styles.scss`. No `tailwind.config.js`, no `@tailwind` directives, no Ionic, no service worker, no Angular Native.
- Guest checkout stays on the public path, with no sign-in wall in front of it.
- The browser never sees a connection string. Payment-provider calls and email sending never happen in browser code.
- The Node server sends order confirmations, an "account is open" notice after sign-up, and password-reset links from the shop's Gmail account. A person can change their name and password or delete their account; the shop keeps their orders, unlinked.
- Pieces the owner adds have no photograph until one is supplied, so every view must work without one.
- Everyone signs in with their own Neon Auth account. The owner gives an account the worker or owner role in the database; there are no shared demo accounts.

## Brand Commitments

- The name is Marlow. The owner released the previous copy voice, the magenta accent, and the Newsreader serif: the old look is evidence of the subject, not a constraint on the redesign.
- Standing preference, chosen on 2026-10-03 over the dealt directions: Marlow follows the category standard for a quiet-luxury fashion shop, executed at full craft with no novelty concept. The craft bar is COS, Arket, and Toteme.

## Evidence on Hand

- Eight garment photographs in `public/garments/`, each 800×1200, in one consistent setting: mauve plaster walls, rumpled linen, window light, dress forms and flat lays.
- Cloth, care, and fit notes for every seeded piece in `src/app/shop/cloth.ts`. Shop practice text on the atelier page.
- Absent, and not to be fabricated: reviews, testimonials, press, customer counts, a street address, opening hours, model photography, sustainability claims.

## Product Principles

1. The pieces lead. Every screen makes the garment, its cloth, and its price easier to see and judge.
2. Honest specifics over persuasion: cloth, care, fit, stock, and costs stated plainly, with no invented urgency or social proof.
3. Never block the purchase. Guest checkout stays open, and every step shows what the order will cost.
4. Staff screens are working tools, scanned and used many times a day.
5. One shop, three doors. Shoppers, workers, and the owner use one product, and each sees only what their role allows.

## Accessibility & Inclusion

WCAG 2.2 AA and clean AXE checks across every surface: visible keyboard focus, focus moved to new content after navigation, text and controls at AA contrast in both color schemes, and reduced motion respected.
