---
version: 1
slug: "src-app-pages-desk-desk-html"
primary_target: "src/app/pages/desk/desk.html"
related_targets: ["src/app/pages/owner/owner.html","src/app/pages/staff/staff-orders.html","src/app/pages/bag/bag.html","src/app/pages/checkout/checkout.html","src/app/pages/order/order.html","src/app/pages/account/account-orders.html","src/app/pages/sign-in/sign-in.html"]
---

# Task surfaces: bag, checkout, order, account, sign-in, desk, backoffice

Mode: Operate. The visual world is the storefront's (see its brief and, once written, DESIGN.md). The world lends type, palette, and density only; layouts, navigation, and controls are the standard ones for each task.

Shopper tasks (bag, checkout, order, account, sign-in): review and change bag lines within stock, enter contact, delivery address, and payment method on one page, confirm the order and keep its reference, and see past orders and their state. Guest checkout never meets a sign-in wall. Errors say what failed and keep everything typed.

Worker tasks (desk, all day): see orders by fulfillment state, open one to see what to pick and where it ships, move it to its next state or cancel it, and correct on-hand stock per size and color. No price or catalog controls.

Owner tasks (backoffice): everything on the desk, plus setting prices in dollars, adding sizes and colors with stock, and creating pieces. Pieces without a photograph must still read clearly.

Standard parts: tabs that filter by state with counts, tables with clear row actions, a detail panel per order, steppers and number inputs for stock, inline save with a visible saved state, a side panel for new pieces. Density is higher than the storefront: condensed table type, tabular figures.

FORM: The category standard (canon) for commerce back offices, at the craft of the storefront benchmarks (COS, Arket, Toteme); seed key 179a4410.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
