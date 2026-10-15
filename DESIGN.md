---
name: Marlow
description: A small ready-to-wear floor, set as a quiet white shop where the garment photographs carry every color.
colors:
  canvas: "#ffffff"
  surface: "#f5f5f4"
  surface-strong: "#ebebea"
  ink: "#000000"
  graphite: "#61615e"
  hairline: "#e3e3e1"
  field-stroke: "#8c8c88"
  error: "#b42318"
  notice: "#8a4b12"
  positive: "#276738"
typography:
  wordmark:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 620
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 125"
  display:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2rem, 1.35rem + 2.2vw, 3.25rem)"
    fontWeight: 450
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.15
  body:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.01em"
  caption:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  data:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 84"
rounded:
  none: "0"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  gutter: "clamp(1rem, 3.2vw, 2.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 1.5rem"
    height: "3rem"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 1.5rem"
    height: "3rem"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 0.875rem"
    height: "2.75rem"
  size-option:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "2.75rem"
  size-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
  filter-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "0 1rem"
    height: "2.5rem"
  filter-chip-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
  summary-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.75rem"
---

# Design System: Marlow

## Overview

**Creative North Star: "The White Room"**

Marlow's floor is a white room hung with eight pieces. The page itself is white, black, and one cool grey ramp, so the only color a shopper sees is in the garment photographs: mauve plaster walls, rumpled linen, camel, ink, oat. The system is the category standard for a quiet-luxury shop, held to the craft of COS, Arket, and Toteme, by the owner's choice over novelty directions. Its distinction is restraint carried all the way through: one typeface, square corners, flat surfaces, and copy that states cloth, care, stock, and cost plainly.

Density changes by job. The storefront is spacious, with large portraits and few words. The checkout is calm and single-column, with the total always in view. The desk and backoffice tighten into condensed, tabular tables built for daily repetition. All of them share the same palette, type, and controls, so a worker on the desk and a shopper on the floor are in the same shop.

Motion answers the shopper and stays quiet otherwise. The opening spread settles once on load; a piece's photograph carries over from the floor to its page through a view transition. Under the pointer, photographs lean in slowly and underlines draw in from the left; on a card the sizes rise over the photograph one after another. Sections and rows below the fold rise into place once, from a slight blur, the first time they reach the viewport. The header tucks away while the shopper reads down a page and returns on the way up. On a phone the opening photographs take turns every six seconds while the marker under them fills; a finger on them stops the count, and reduced motion starts them paused. The bag and the menu slide in from the edge; the bag count bumps when it changes; a line just added to the bag flashes once. A placed order draws its check and fills its track. Reduced motion collapses all of it, and nothing waits for the viewport when motion is reduced or the page is printed.

**Key Characteristics:**

- White ground, black type, grey panels; the photographs are the palette.
- One family, Archivo, stretched by its width axis: expanded for the wordmark, normal for reading, condensed for staff data.
- Square corners everywhere except the bag count and color swatches.
- Flat at rest: depth comes from grey fills and the scrim behind sheets.
- Built on Spartan UI (Brain plus the `lyra` Helm style), themed entirely from these tokens.
- Prices, sizes, and stock always in plain words with tabular figures.

## Colors

A monochrome working palette that lets the mauve, camel, and ink of the photographs be the only color in the room.

### Primary

- **Ink Black** (#000000): all type, the primary button, the selected size and current filter, the announcement band, and the free-shipping meter's fill. Black is the action color; there is no separate brand accent.

### Neutral

- **Gallery White** (#ffffff): the page ground and the text on black buttons.
- **Fitting-Room Grey** (#f5f5f4): quiet panels: the checkout and bag summaries, the order facts, the desk's open-order details, photo placeholders, and hover on icon buttons.
- **Chalk Grey** (#ebebea): heavier fills: disabled buttons, the selected piece in the backoffice list, the one-time flash on a line just added to the bag.
- **Graphite** (#61615e): secondary text: ledes, metadata, captions, empty states (6.2:1 on white).
- **Hairline** (#e3e3e1): 1px dividers between rows of data and around unselected chips and size boxes. Decorative only; never the sole marker of a control.
- **Field Stroke** (#8c8c88): input borders, at 3.4:1 against white so fields read as controls.

### State

- **Oxblood Error** (#b42318): field errors and failed actions, always with words.
- **Rust Notice** (#8a4b12): "Only 2 left", and the dot for orders being picked or ready.
- **Bottle Green** (#276738): the dot for completed orders.

The dark scheme keeps the same roles: ground #121212, panels #1c1c1b and #262625, type #f4f4f2, secondary text #a8a8a3, hairline #303030, field stroke #7c7c78, black actions become #f4f4f2 with dark text, and the announcement band becomes #262625 so it never glares. Every text pair meets WCAG AA in both schemes.

### Named Rules

**The Photograph Carries the Color Rule.** No hue enters the interface except through the garment photographs and the three state colors. A new screen gets its warmth from photography, not from tinting the chrome.

**The Black Is the Action Rule.** One filled black control per decision: Add to bag, Check out, Place order, the next fulfillment step. Everything secondary is outlined, underlined, or quiet.

## Typography

**Display Font:** Archivo Variable (with Helvetica Neue, Arial, sans-serif)
**Body Font:** Archivo Variable (same family)

**Character:** A neutral, slightly industrial grotesk that stays out of the garments' way. Its width axis does the work a second typeface would: 125% for the woven-label wordmark, 100% for everything a shopper reads, 84% for staff tables.

### Hierarchy

- **Wordmark** (620, 1.0625rem, 0.16em tracking, 125% width, uppercase): the Marlow mark in the header, menu, and footer. The only uppercase text in the system.
- **Display** (450, clamp(2rem, 1.35rem + 2.2vw, 3.25rem), 1.15, -0.03em): the floor's opening line, category titles, and the atelier title. Never more than one per page.
- **Headline** (500, 1.625rem, 1.15, -0.02em): page titles in task flows (Checkout, Bag, Order, Daily desk, Backoffice) and the product name.
- **Title** (500, 1rem, 0 tracking): section headings inside pages: Contact, Delivery, Payment, Pieces, More from the floor.
- **Body** (400, 1rem, 1.55): running text, kept within 62ch.
- **Label** (500, 0.875rem, 0.01em): buttons and product names on cards. Navigation and prices use the same size at 400.
- **Caption** (400, 0.8125rem): metadata, hints, errors, breadcrumbs, filter chips.
- **Data** (400, 0.875rem, 84% width, tabular figures): every staff table.

### Named Rules

**The One Family Rule.** Archivo only. Change width or weight for a new role; never add a face.

**The Figures Line Up Rule.** Prices, quantities, counts, and references use tabular figures wherever they stack or sit in columns.

## Layout

Content sits in a centered container up to 90rem wide with a fluid gutter of clamp(1rem, 3.2vw, 2.5rem); spacing follows 0.25rem steps, with more space above a heading than below it. Breakpoints are 40rem, 48rem, 64rem, and 80rem.

- **Floor:** a full-bleed spread of three 2:3 portraits about half the window high (on a phone, one at a time in a carousel that turns every six seconds and that the shopper can swipe, with a 2px marker under it per photograph whose black fill grows toward the next turn, and a pause button at the row's right edge), each with a white label naming the piece and its price (shown on hover where hover exists, always on touch); then the opening line beside the terms; then a product grid of 2, 3, and 4 columns at the phone, tablet, and wide breakpoints, with 2.5–3rem between rows; then the "Cloth and care" note (the merino flat lay beside the atelier's own words) and "Shop by category", one photograph per room.
- **Bag:** only the drawer; there is no bag page. Under Check out, "Keep shopping" closes it on the page the shopper was on.
- **Category:** from 64rem, a split: title, fit note, and filters in a sticky left column, the pieces two-up on the right.
- **Product:** from 64rem, the photograph sized to the window's height beside a 20–27rem buy panel, centered as one composition; under a mouse the photograph magnifies 1.6 times around the pointer so the cloth can be read. On a phone the photograph runs edge to edge and a fixed buy bar appears once the main button scrolls away.
- **Checkout:** a form of at most 40rem beside a sticky 20–26rem summary, inside a 76rem container; on a phone the summary folds into a bar showing the total.
- **Staff:** a title, a lede, link tabs for sections, then full-width tables that scroll sideways on small screens.

## Elevation & Depth

Flat at rest. Depth is tonal: grey panels for summaries and details, a darker grey for selection, and a scrim (black at 36% in light, 60% in dark) behind the bag and menu sheets, with no blur. Spartan's sheet shadow and card ring are removed. The bag notice toast is the single shadowed element, because it floats over content it does not belong to.

### Shadow Vocabulary

- **Toast** (`box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.18)`): the bag notice at the bottom of the screen. Nothing else casts a shadow.

### Named Rules

**The Flat Floor Rule.** Cards, panels, and buttons have no shadow and no border-plus-shadow pairing. If something must stand apart, give it a grey fill.

## Shapes

Square. Buttons, inputs, size boxes, chips, panels, sheets, and photographs all have 0 radius. Product photographs keep their 2:3 portrait frame wherever a piece is shown: cards, the product page, bag lines, summaries, the backoffice list. Only the floor's opening spread and the atelier's lead photograph crop wider, because they set a scene rather than show a piece. The only round shapes are the bag count (a pill) and color swatches (circles), which are markers, not containers.

## Components

### Spartan underneath

Every control is a Spartan part: Brain for behavior and accessibility, Helm (`lyra`, the square and flat style) for structure. Spartan's semantic names (`--primary`, `--accent`, `--border`, `--card`, ...) are aliases of these tokens in `src/tailwind.css`, with `--radius: 0`, so Spartan follows dark mode through the tokens. The generated Helm files stay as the CLI wrote them. Two thin layers carry Marlow's scale on top: `ShopButton` gives every `hlmBtn` the shop's heights, and an unlayered block in `src/styles.scss` sets the type, padding, and focus outline of Spartan's `data-slot` parts. Icons are Lucide through ng-icons at a 1.5px stroke, one set for Spartan's parts and the shop's own.

### Buttons

- **Shape:** square (0), 3rem tall, 1.5rem side padding; a 2.25rem small size serves table rows; icon buttons are 2.75rem touch targets.
- **Primary** (`hlmBtn`): Ink Black fill, white label at 500 weight. Hover mixes 25% of the ground into the black; a press nudges it down 1px.
- **Secondary** (`variant="outline"`): 1px Ink Black outline on the ground; hover fills it Ink Black with a white label.
- **Text button** (`variant="link"`): an underlined caption-size action (Remove, Cancel, Keep, Copy reference) for secondary actions that sit inline; the underline thickens on hover.
- **Destructive** (`variant="destructive"`): Oxblood Error text on a 10% Oxblood wash; hover fills it Oxblood with a white label. Used only for what cannot be undone, on the button that asks and on the one that confirms: "Delete account", and "Cancel" at the top right of an order's page, beside its number, each opening a confirm dialog.
- **Disabled:** Chalk Grey fill with Graphite text, out of the tab order. Busy buttons carry aria-busy, show Spartan's spinner, and change their label ("Placing order").

### Chips

- **Style:** square, 2.5rem tall, 1px Hairline border, caption type with a Graphite count.
- **State:** the current category or order state fills Ink Black with white text. Category chips are links; desk state chips are native radios.

### Cards / Containers

- **Product card:** a 2:3 photograph over the name and price; no frame, no shadow. The photograph leans in (1.045) over 1.2s under the pointer, and the name's underline draws in. A white square plus button at the photograph's foot opens the sizes, which rise over the photograph on a white bar, each size a beat after the last (also on hover where hover exists). The frame clips with `overflow: clip`, so returning focus can never scroll the photograph. A piece with nothing left shows a Spartan badge, "Sold out". A piece with no photograph shows a grey panel with its cloth swatch and "No photograph yet".
- **Summary panel:** a Spartan card in Fitting-Room Grey, 1.75rem padding, square, no ring; holds order lines, totals, and the free-shipping meter (Spartan's progress bar at 2px).
- **Empty states:** Spartan's empty part: a grey icon tile, a 1.25rem title, one line of direction, and the next action (Shop the floor). Used for the empty bag, an empty checkout, no orders, a closed area, and staff views with nothing in them. The empty bag is the exception: it closes with "Keep shopping", the same link the full bag offers under Check out, above its list of categories.
- **Loading:** Spartan skeletons in Chalk Grey shaped like the rows they stand in for, with the loading sentence kept for screen readers.
- **Alerts:** Spartan's destructive alert on a Fitting-Room Grey fill with a circled-alert icon and the problem in words.
- **Settings sections:** the account page is a column of sections divided by Hairline rules, each with its title and one line of purpose on the left and its form or action on the right (stacked on a phone). Read-only facts are a label over the value. Saving reports in a status line beside the button rather than a toast.
- **Confirm dialog:** Spartan's alert dialog, square and shadowless on the scrim, 28rem wide (one rule for every dialog, on `[data-slot='alert-dialog-content']` in `src/styles.scss`); it says what is lost and what is kept, and offers the safe choice ("Keep the account", "Keep the order") before the destructive one. Deleting an account asks for the password, and focus starts in that field; cancelling an order starts focus on "Keep the order".

### Inputs / Fields

- **Style:** 2.75rem tall, 1px Field Stroke border, white ground, square, 1rem text so phones never zoom.
- **Focus:** the border turns Ink Black with a 2px Ink Black outline.
- **Error:** the border turns Oxblood Error, the message sits under the field and is linked with aria-describedby; the first invalid field takes focus on submit, and nothing typed is lost.
- **Choices:** payment methods are bordered rows around native radios with a Lucide mark (shop, bank, cash); the checked row gets an Ink Black border. Sizes are boxes around visually hidden radios; sold-out sizes are struck through on grey and disabled. Asked to add without a size, the row nudges once and the line under it says what to do.
- **Signal Forms fields** stay on the shop's `TextField` (a native input with the `.input` look) rather than Spartan's input, because Spartan's input marks a required field invalid before it is touched.
- **Errors** show under a field once focus leaves it, in Oxblood Error at the small size, and the field's border turns Oxblood with them; a hint (the postal format, the calling code) sits above the error in muted text.
- **Back link:** a left arrow and "Back" at the UI size, above the page's content and in line with it (with the photograph on a product page, with the heading on a phone); under the pointer it underlines and the arrow steps left.
- **Find and sort:** a client's order list opens with a bar of field-sized controls: the reference search (a magnifier inside the field's frame; focus outlines the whole frame), the Sort select, and an underlined "Clear filters" link while anything is set. Under it, a muted count ("1 of 4 orders"), and each row names its date before the pieces.
- **Country search:** the country field reads like any `.input`, with a muted chevron that darkens under the pointer. Typing opens Spartan's combobox list below it: continent headings in small muted type, countries at the field's own size in 44px rows, the chosen one ticked, and "No country by that name" when nothing matches.

### Navigation

- **Header:** sticky, white, with a Hairline bottom border; it tucks away while the shopper scrolls down past the first screen and returns on any scroll up or when something inside it takes focus. On desktop: the wordmark, departments at label size, then Atelier, Desk or Backoffice for staff, the person's name and Orders once signed in (Sign in before), the bag icon with the count on its corner, and, signed in, the sign-out icon last. Icon buttons fill Fitting-Room Grey under the pointer. Links draw a 1px underline in from the left on hover; the current page keeps it. On a phone: a menu button, the centered wordmark, and the bag icon with the count on its corner.
- **Menu and bag:** Spartan sheets (CDK dialogs) that slide in from the left and right edges over the scrim (420ms in, 260ms out), close on Escape, scrim click, or navigation, and return focus to their buttons. Both load with `@defer` on idle, or the moment they are asked to open, so the overlay code stays out of the first page. The menu's rooms arrive one after another.
- **Breadcrumb:** Spartan's breadcrumb with chevrons, caption size, through the shared `Breadcrumb` component (`src/app/ui/breadcrumb.ts`): "Shop › Shirts › Oxford Cloth Shirt" on a product page, "Shop › Shirts" over a category's title, "Your account › Orders" on a client's orders. The last step is the page itself, unlinked and marked current.
- **Staff sections:** link tabs whose 2px Ink Black underline grows under the current section.
- **Hover:** every link and button changes under the pointer and shows the hand. The wordmark fades to 60%; a current link's underline thickens to 2px; a current chip lightens its black; a disabled control does not react.

### Status badge

An outlined Spartan badge holding a small dot and the state's name (`StatusBadge`): Placed in Ink Black, Picking and Ready in Rust Notice, Completed in Bottle Green, Cancelled in Oxblood Error. A bank transfer's payment uses the same badge beside it: "Payment pending" in Rust Notice, "Paid" in Bottle Green. The name always carries the meaning.

### Simulated bank

`/bank/<reference>/<code>` stands outside the shop: no Marlow header or footer, a plain bar naming "Sandbox Bank" with a "Simulation" tag, a line saying no money moves, and one white panel on the surface grey with the transfer's facts (amount last, above a hairline) and a full-width "Send $…" button. After sending, the panel says "Transfer sent" and focus lands on it.

### Details and lists

- **Accordion:** the product's Cloth and care (open) and Fit, as Spartan accordion items at label size, the chevron turning with the panel.
- **Items:** the client's orders are outlined Spartan items that darken their border on hover and nudge their chevron.
- **Tables:** the desk and backoffice use Spartan's table parts at the condensed data width, with an Ink Black rule under the header and a Fitting-Room Grey picking list under an opened order.

## Do's and Don'ts

### Do:

- **Do** let photographs supply the color; keep chrome to Ink Black, Gallery White, and the greys.
- **Do** give every slot that shows a piece a 2:3 frame, at any size.
- **Do** state prices, sizes, stock, and costs in words with tabular figures, and keep the total visible wherever money is being committed.
- **Do** mark selection and state with a fill or a word; the color dot only assists.
- **Do** underline links inside running text, and keep focus outlines visible (2px Ink Black, 3px offset).
- **Do** use Archivo's width axis for new roles: condensed (84%) only in dense staff tables, expanded (125%) only for the wordmark.
- **Do** reach for a Spartan part before writing markup, import `ShopButtonImports` rather than `HlmButton` alone, and change Spartan's look through the tokens or the unlayered `data-slot` block, never by editing the generated Helm files.

### Don't:

- **Don't** add a brand accent color or tint the interface with the photographs' mauve.
- **Don't** round corners or add shadows to cards, panels, or buttons.
- **Don't** mark a selected list item with a colored side stripe; use a grey fill.
- **Don't** set labels or headings in uppercase; only the wordmark is uppercase.
- **Don't** put a label or eyebrow above a heading; the heading speaks for itself.
- **Don't** introduce a second typeface.
