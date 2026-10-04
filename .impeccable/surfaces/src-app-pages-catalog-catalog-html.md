---
version: 1
slug: "src-app-pages-catalog-catalog-html"
primary_target: "src/app/pages/catalog/catalog.html"
related_targets: ["src/app/pages/product/product.html","src/app/pages/atelier/atelier.html","src/app/layout/shell.html"]
---

# Storefront: floor, categories, product pages, atelier

Mode: Persuade (the atelier page reads as Read).

Audience and job: shoppers deciding whether a $89 to $420 piece is worth it, on a phone or a laptop, mostly as guests. Action: choose a size and add to bag, then check out. Proof on hand: eight photographs, cloth, care, and fit notes, plain shipping and payment terms. Nothing else may be claimed.

Constraints: SSR for the floor, categories, product pages, and atelier. Tailwind 4 on the tokens in `src/styles.scss`. WCAG 2.2 AA. Pieces without a photograph must still look finished.

## Direction contract

THESIS: Marlow as the category's best quiet-luxury shop, at COS, Arket, and Toteme craft. Photographs lead, words stay few, and buying takes the fewest steps. It refuses novelty concepts and decorative chrome, and equally the category's sloppiness: hidden sizes, dead-end bags, sign-in walls, prices you have to hunt for.

OWN-WORLD: White ground, black type, one cool grey ramp, no brand accent: the garments' mauve photographs carry all the color. One neutral grotesk, Archivo, small and quiet, with a restrained scale. Square-cornered controls, a black filled primary button, hairline rules only where they separate data.

STORY: The shopper sees the whole floor with prices at once, opens a piece, picks a size from a sticky panel, and adds it. The bag slides in with a checkout button and the free-shipping remainder. Checkout is one page with the total always in view.

FIRST VIEWPORT: Slim header: wordmark left, categories beside it, Atelier, account, and bag count right. A full-bleed spread of three portraits fills about half the height (amended after the finish review: two thirds left no room for the grid on a laptop). Under it, one line on what Marlow is and its terms, and the top of the product grid, where every card has a working quick add.

FORM: The category standard (canon), chosen by the owner over the dealt hand; seed key 179a4410.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

Quick add on the floor: hover or focus a card, choose a size, and the bag slides in with that line, without leaving the floor.

## Open decisions

- None outstanding from the owner. Product photography beyond the eight seeded pieces does not exist yet.
