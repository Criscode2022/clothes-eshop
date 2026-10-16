import { SPANISH } from '../app/i18n/es';
import { asLocale } from '../app/i18n/locale';
import type { Locale } from '../app/i18n/locale';
import { translate, useSpanish } from '../app/i18n/translate';
import type { CopyParams } from '../app/i18n/translate';

useSpanish(SPANISH);
import { MARLOW_ACCOUNT, SANDBOX_BANK } from '../app/shop/bank-transfer';
import { addressLines, paymentLabel } from '../app/shop/checkout';
import type { ShopOrder } from '../app/shop/checkout';
import { fulfillmentNote } from '../app/shop/fulfillment';
import type { Fulfillment } from '../app/shop/fulfillment';
import { formatMoney } from '../app/shop/money';
import { PICKUP_POINT } from '../app/shop/pickup-point';

type Say = (english: string, params?: CopyParams) => string;

function say(locale: Locale): Say {
  return (english, params) => translate(locale, english, params);
}

/** One message, ready for any mailer: the HTML part and the plain-text part say the same thing. */
export interface Email {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

/** What Neon Auth asks the shop to deliver: a link to open, or a code to type. */
export type AuthPurpose = 'forget-password' | 'email-verification' | 'sign-in';

export interface AuthLink {
  readonly kind: AuthPurpose;
  readonly to: string;
  readonly link: string;
  readonly minutes: number;
  /** The language the person was using when they asked. Absent is English. */
  readonly locale?: Locale;
}

export interface AuthCode {
  readonly kind: AuthPurpose;
  readonly to: string;
  readonly code: string;
  readonly minutes: number;
  /** The language the person was using when they asked. Absent is English. */
  readonly locale?: Locale;
}

/**
 * The order confirmation. A bank transfer also gets the account to pay into and a link to the
 * simulated bank (`transferPath`, signed for this order); the other methods are paid in person.
 */
export function orderPlacedEmail(
  order: ShopOrder,
  shopUrl: string,
  transferPath: string | null,
): Email {
  const locale = asLocale(order.locale);
  const t = say(locale);
  const orderUrl = `${shopUrl}/order/${encodeURIComponent(order.reference)}`;
  const shipping = order.shippingCents === 0 ? t('Free') : formatMoney(order.shippingCents);
  const transfer = transferPath ? transferInstructions(order, `${shopUrl}${transferPath}`, t) : null;
  const method = t(paymentLabel(order.paymentMethod));
  const payment = transfer
    ? t('{method}, pending until the transfer arrives. No card was taken.', { method })
    : t('{method}. No card was taken.', { method });
  const place = handoverOf(order, t);
  const placeNote = order.delivery === 'pickup' ? `${place.note} ${t(READY_EMAIL_NOTE)}` : '';
  const lines = order.lines.map((line) => ({
    name: t(line.name),
    detail: t('{color}, size {size}, {quantity} × {price}', {
      color: t(line.color),
      size: line.size,
      quantity: line.quantity,
      price: formatMoney(line.unitPriceCents),
    }),
    price: formatMoney(line.lineCents),
  }));
  const thanks = t('Thank you, {name}. Your order is placed.', { name: order.contact.name });
  const reference = t('Order {reference}', { reference: order.reference });

  const text = [
    thanks,
    '',
    reference,
    ...lines.map((line) => `${line.name}: ${line.detail}, ${line.price}`),
    '',
    t('{label}: {value}', { label: t('Subtotal'), value: formatMoney(order.subtotalCents) }),
    t('{label}: {value}', { label: t(shippingRowOf(order)), value: shipping }),
    t('{label}: {value}', { label: t('Total'), value: formatMoney(order.totalCents) }),
    '',
    t('{label}: {value}', { label: t('Payment'), value: payment }),
    ...(transfer ? ['', ...transfer.text, ''] : []),
    `${place.heading}: ${place.lines.join(', ')}`,
    ...(placeNote ? [placeNote] : []),
    '',
    t('Keep the reference: it is how the shop finds your order.'),
    t('See your order: {url}', { url: orderUrl }),
  ].join('\n');

  const rows = lines
    .map(
      (line) => `<tr>
        <td style="${CELL}"><strong style="font-weight:500">${escape(line.name)}</strong><br>
          <span style="color:${MUTED}">${escape(line.detail)}</span></td>
        <td style="${CELL}text-align:right;white-space:nowrap">${escape(line.price)}</td>
      </tr>`,
    )
    .join('');
  const totals = [
    [t('Subtotal'), formatMoney(order.subtotalCents)],
    [t(shippingRowOf(order)), shipping],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:4px 0;color:${MUTED}">${escape(label)}</td>
        <td style="padding:4px 0;text-align:right">${escape(value)}</td>
      </tr>`,
    )
    .join('');

  return {
    to: order.contact.email,
    subject: t('Your Marlow order {reference}', { reference: order.reference }),
    text,
    html: layout({
      locale,
      preheader: t('Order {reference} is placed. Total {total}.', {
        reference: order.reference,
        total: formatMoney(order.totalCents),
      }),
      heading: thanks,
      body: `
        <p style="${P}">${escape(t('Order'))} <strong style="font-weight:500">${escape(order.reference)}</strong></p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 16px">
          ${rows}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${totals}
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid ${HAIRLINE};font-weight:500">${escape(t('Total'))}</td>
            <td style="padding:12px 0 0;border-top:1px solid ${HAIRLINE};text-align:right;font-weight:500">${escape(formatMoney(order.totalCents))}</td>
          </tr>
        </table>
        <p style="${P}margin-top:24px"><strong style="font-weight:500">${escape(t('Payment'))}</strong><br>${escape(payment)}</p>
        ${transfer?.html ?? ''}
        ${handoverHtml(place, placeNote)}`,
      action: { label: t('See your order'), href: orderUrl },
      footnote: t('Keep the reference: it is how the shop finds your order.'),
    }),
  };
}

/** The steps a client hears about by email: when to expect the parcel, and when to come for the order. */
const PROGRESS_NEWS: Partial<Record<Fulfillment, string>> = {
  shipped: 'is on its way',
  ready: 'is ready to pick up',
};

/** "On its way" or "Ready to pick up", or null for a step that needs no email. */
export function orderProgressEmail(order: ShopOrder, shopUrl: string): Email | null {
  const news = PROGRESS_NEWS[order.fulfillment];
  if (!news) {
    return null;
  }
  const locale = asLocale(order.locale);
  const t = say(locale);
  const orderUrl = `${shopUrl}/order/${encodeURIComponent(order.reference)}`;
  const heading = t(`Your order ${news}`);
  const note = fulfillmentNote(order, locale);
  const place = handoverOf(order, t);
  const payment = paymentDueOf(order, t);
  return {
    to: order.contact.email,
    subject: t(`Your Marlow order {reference} ${news}`, { reference: order.reference }),
    text: [
      `${heading}.`,
      '',
      note,
      '',
      `${place.heading}: ${place.lines.join(', ')}`,
      ...(place.note ? [place.note] : []),
      '',
      payment,
      '',
      t('See your order: {url}', { url: orderUrl }),
    ].join('\n'),
    html: layout({
      locale,
      preheader: note,
      heading: `${heading}.`,
      body: `
        <p style="${P}">${escape(note)}</p>
        ${handoverHtml(place, place.note)}
        <p style="${P}"><strong style="font-weight:500">${escape(t('Payment'))}</strong><br>${escape(payment)}</p>`,
      action: { label: t('See your order'), href: orderUrl },
      footnote: t('Keep the reference: it is how the shop finds your order.'),
    }),
  };
}

export function accountCreatedEmail(
  person: { name: string; email: string },
  shopUrl: string,
  locale: Locale = 'en',
): Email {
  const t = say(locale);
  const accountUrl = `${shopUrl}/account`;
  const greeting = person.name ? t('Hello {name},', { name: person.name }) : t('Hello,');
  const opened = t('Your Marlow account for {email} is open.', { email: person.email });
  const kept = t('Orders you place while signed in are kept under your name.');
  const manage = t(
    'You can change your name or password, or delete the account, on Your account.',
  );
  const notYou = t(NOT_YOU_ACCOUNT);
  return {
    to: person.email,
    subject: t('Your Marlow account is open'),
    text: [greeting, '', opened, kept, manage, '', t('Your account: {url}', { url: accountUrl }), '', notYou].join(
      '\n',
    ),
    html: layout({
      locale,
      preheader: opened,
      heading: t('Your account is open'),
      body: `
        <p style="${P}">${escape(greeting)}</p>
        <p style="${P}">${escape(opened)} ${escape(kept)}</p>
        <p style="${P}">${escape(manage)}</p>`,
      action: { label: t('Go to your account'), href: accountUrl },
      footnote: notYou,
    }),
  };
}

const LINK_WORDING: Record<
  AuthPurpose,
  { subject: string; heading: string; lede: string; action: string; notYou: string }
> = {
  'forget-password': {
    subject: 'Choose a new Marlow password',
    heading: 'Choose a new password',
    lede: 'Someone asked to reset the password of your Marlow account.',
    action: 'Choose a new password',
    notYou: 'If it was not you, ignore this email: your password stays as it is.',
  },
  'email-verification': {
    subject: 'Confirm your Marlow email',
    heading: 'Confirm your email',
    lede: 'Open the link to confirm the email address of your Marlow account.',
    action: 'Confirm the email',
    notYou: 'If you did not create a Marlow account, ignore this email.',
  },
  'sign-in': {
    subject: 'Your Marlow sign-in link',
    heading: 'Sign in to Marlow',
    lede: 'Open the link to sign in to your Marlow account.',
    action: 'Sign in',
    notYou: 'If you did not ask to sign in, ignore this email.',
  },
};

export function authLinkEmail(request: AuthLink): Email {
  const t = say(asLocale(request.locale));
  const link = webAddress(request.link);
  const wording = LINK_WORDING[request.kind];
  const lasts = t('The link works for {minutes} minutes.', { minutes: request.minutes });
  const lede = t(wording.lede);
  return {
    to: request.to,
    subject: t(wording.subject),
    text: [lede, lasts, '', link, '', t(wording.notYou)].join('\n'),
    html: layout({
      locale: asLocale(request.locale),
      preheader: `${lede} ${lasts}`,
      heading: t(wording.heading),
      body: `<p style="${P}">${escape(lede)} ${escape(lasts)}</p>`,
      action: { label: t(wording.action), href: link },
      footnote: t(wording.notYou),
    }),
  };
}

const CODE_WORDING: Record<AuthPurpose, string> = {
  'forget-password': 'Use this code to choose a new password for your Marlow account.',
  'email-verification': 'Use this code to confirm the email address of your Marlow account.',
  'sign-in': 'Use this code to sign in to your Marlow account.',
};

export function authCodeEmail(request: AuthCode): Email {
  const locale = asLocale(request.locale);
  const t = say(locale);
  const lede = t(CODE_WORDING[request.kind]);
  const lasts = t('It works for {minutes} minutes.', { minutes: request.minutes });
  const notYou = t('If you did not ask for it, ignore this email.');
  return {
    to: request.to,
    subject: t('Your Marlow code: {code}', { code: request.code }),
    text: [lede, '', request.code, '', lasts, notYou].join('\n'),
    html: layout({
      locale,
      preheader: t('{code}. It works for {minutes} minutes.', {
        code: request.code,
        minutes: request.minutes,
      }),
      heading: t('Your code'),
      body: `
        <p style="${P}">${escape(lede)}</p>
        <p style="margin:0 0 16px;font-size:28px;letter-spacing:0.2em;font-variant-numeric:tabular-nums">${escape(request.code)}</p>
        <p style="${P}">${escape(lasts)}</p>`,
      footnote: notYou,
    }),
  };
}

const NOT_YOU_ACCOUNT =
  'If you did not create this account, choose a new password from the sign-in page and delete the account.';

// The White Room in an inbox: white ground, black type, one hairline, one black button.
// Email clients ignore stylesheets and most fonts, so every style is inline and Archivo falls back.
const FONT = "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = '#000000';
const MUTED = '#61615e';
const HAIRLINE = '#e3e3e1';
/** The site's --color-surface, the fill its panels sit on. */
const SURFACE = '#f5f5f4';
const P = 'margin:0 0 16px;';
const CELL = `padding:12px 0;border-bottom:1px solid ${HAIRLINE};vertical-align:top;`;

const READY_EMAIL_NOTE = 'We email you when it is ready to pick up.';

interface Handover {
  /** "Ship to" or "Pick up at". */
  readonly heading: string;
  readonly lines: readonly string[];
  /** The shop's hours, for an order picked up there. */
  readonly note: string;
}

/** Where the order goes: the client's address, or the shop's counter. */
function handoverOf(order: ShopOrder, t: Say): Handover {
  if (order.shipping) {
    return {
      heading: t('Ship to'),
      lines: [order.contact.name, ...addressLines(order.shipping).map((line) => t(line))],
      note: '',
    };
  }
  return {
    heading: t('Pick up at'),
    lines: [PICKUP_POINT.name, ...PICKUP_POINT.lines.map((line) => t(line))],
    note: t(`${PICKUP_POINT.hours}.`),
  };
}

function handoverHtml(place: Handover, note: string): string {
  const lines = place.lines.map(escape).join('<br>');
  const after = note ? `<br><span style="color:${MUTED}">${escape(note)}</span>` : '';
  return `<p style="${P}"><strong style="font-weight:500">${escape(place.heading)}</strong><br>${lines}${after}</p>`;
}

/** The totals row that ships the order, or says picking it up costs nothing. */
function shippingRowOf(order: ShopOrder): string {
  return order.delivery === 'pickup' ? 'Pick up' : 'Shipping';
}

/** What is left to pay when the order arrives or is picked up, and how. */
function paymentDueOf(order: ShopOrder, t: Say): string {
  const total = formatMoney(order.totalCents);
  switch (order.paymentMethod) {
    case 'shop-floor':
      return t('Pay at the shop: {total}, at the counter.', { total });
    case 'cash-on-delivery':
      return t('Cash when it arrives: have {total} ready for the carrier.', { total });
    case 'bank-transfer':
      return order.paidAt
        ? t('Bank transfer, paid.')
        : t('Bank transfer, pending until the transfer arrives.');
  }
}

/** Where to send the money, and the simulated bank that sends it. Both are fictional, and the email says so. */
function transferInstructions(
  order: ShopOrder,
  url: string,
  t: Say,
): { text: string[]; html: string } {
  const rows = [
    [t('Account name'), MARLOW_ACCOUNT.name],
    [t('IBAN'), MARLOW_ACCOUNT.iban],
    [t('BIC'), MARLOW_ACCOUNT.bic],
    [t('Amount'), formatMoney(order.totalCents)],
    [t('Reference to quote'), order.reference],
  ];
  const note = t(
    'This is a demo shop: the account is fictional, and the link opens {bank}, a simulated bank where no money moves. Once the transfer is sent, the order is marked paid.',
    { bank: SANDBOX_BANK },
  );
  return {
    text: [
      t('Pay by bank transfer to:'),
      ...rows.map(([label, value]) => t('{label}: {value}', { label, value })),
      t('Pay with {bank}: {url}', { bank: SANDBOX_BANK, url }),
      note,
    ],
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;background:${SURFACE}">
          ${rows
            .map(
              ([label, value]) => `<tr>
            <td style="padding:8px 16px;color:${MUTED}">${escape(label)}</td>
            <td style="padding:8px 16px;text-align:right;font-weight:500">${escape(value)}</td>
          </tr>`,
            )
            .join('')}
        </table>
        ${button(t('Pay with {bank}', { bank: SANDBOX_BANK }), url)}
        <p style="${P}color:${MUTED};font-size:13px">${escape(note)}</p>`,
  };
}

function layout(parts: {
  locale: Locale;
  preheader: string;
  heading: string;
  body: string;
  action?: { label: string; href: string };
  footnote: string;
}): string {
  const action = parts.action ? button(parts.action.label, parts.action.href) : '';
  return `<!doctype html>
<html lang="${parts.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(parts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:${FONT};font-size:15px;line-height:1.55">
<span style="display:none;max-height:0;overflow:hidden">${escape(parts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse;text-align:left">
    <tr><td style="padding:0 0 24px;border-bottom:1px solid ${HAIRLINE};font-size:15px;font-weight:600;letter-spacing:0.16em">MARLOW</td></tr>
    <tr><td style="padding:32px 0 8px">
      <h1 style="margin:0 0 24px;font-size:24px;font-weight:500;line-height:1.2;letter-spacing:-0.02em">${escape(parts.heading)}</h1>
      ${parts.body}
      ${action}
    </td></tr>
    <tr><td style="padding:24px 0 0;border-top:1px solid ${HAIRLINE};font-size:13px;color:${MUTED}">${escape(parts.footnote)}</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<p style="margin:24px 0">
        <a href="${escape(href)}" style="display:inline-block;padding:14px 24px;background:${INK};color:#ffffff;text-decoration:none;font-weight:500">${escape(label)}</a>
      </p>`;
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Links in an email must be web addresses; anything else is refused rather than sent. */
function webAddress(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('An email link must be a web address.');
  }
  return url.toString();
}
