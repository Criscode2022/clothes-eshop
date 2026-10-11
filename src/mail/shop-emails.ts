import { paymentLabel } from '../app/shop/checkout';
import type { ShopOrder } from '../app/shop/checkout';
import { formatMoney } from '../app/shop/money';

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
}

export interface AuthCode {
  readonly kind: AuthPurpose;
  readonly to: string;
  readonly code: string;
  readonly minutes: number;
}

export function orderPlacedEmail(order: ShopOrder, shopUrl: string): Email {
  const orderUrl = `${shopUrl}/order/${encodeURIComponent(order.reference)}`;
  const shipping = order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents);
  const payment = `${paymentLabel(order.paymentMethod)}. No card was taken.`;
  const address = [
    order.contact.name,
    order.shipping.line1,
    `${order.shipping.city} ${order.shipping.postalCode}`,
    order.shipping.country,
  ];
  const lines = order.lines.map((line) => ({
    name: line.name,
    detail: `${line.color}, size ${line.size}, ${line.quantity} × ${formatMoney(line.unitPriceCents)}`,
    price: formatMoney(line.lineCents),
  }));

  const text = [
    `Thank you, ${order.contact.name}. Your order is placed.`,
    '',
    `Order ${order.reference}`,
    ...lines.map((line) => `${line.name}: ${line.detail}, ${line.price}`),
    '',
    `Subtotal: ${formatMoney(order.subtotalCents)}`,
    `Shipping: ${shipping}`,
    `Total: ${formatMoney(order.totalCents)}`,
    '',
    `Payment: ${payment}`,
    `Delivery to: ${address.join(', ')}`,
    '',
    'Keep the reference: it is how the shop finds your order.',
    `See your order: ${orderUrl}`,
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
    ['Subtotal', formatMoney(order.subtotalCents)],
    ['Shipping', shipping],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:4px 0;color:${MUTED}">${label}</td>
        <td style="padding:4px 0;text-align:right">${escape(value)}</td>
      </tr>`,
    )
    .join('');

  return {
    to: order.contact.email,
    subject: `Your Marlow order ${order.reference}`,
    text,
    html: layout({
      preheader: `Order ${order.reference} is placed. Total ${formatMoney(order.totalCents)}.`,
      heading: `Thank you, ${order.contact.name}. Your order is placed.`,
      body: `
        <p style="${P}">Order <strong style="font-weight:500">${escape(order.reference)}</strong></p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 16px">
          ${rows}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${totals}
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid ${HAIRLINE};font-weight:500">Total</td>
            <td style="padding:12px 0 0;border-top:1px solid ${HAIRLINE};text-align:right;font-weight:500">${escape(formatMoney(order.totalCents))}</td>
          </tr>
        </table>
        <p style="${P}margin-top:24px"><strong style="font-weight:500">Payment</strong><br>${escape(payment)}</p>
        <p style="${P}"><strong style="font-weight:500">Delivery to</strong><br>${address.map(escape).join('<br>')}</p>`,
      action: { label: 'See your order', href: orderUrl },
      footnote: 'Keep the reference: it is how the shop finds your order.',
    }),
  };
}

export function accountCreatedEmail(
  person: { name: string; email: string },
  shopUrl: string,
): Email {
  const accountUrl = `${shopUrl}/account`;
  const greeting = person.name ? `Hello ${person.name},` : 'Hello,';
  const opened = `Your Marlow account for ${person.email} is open.`;
  const kept = 'Orders you place while signed in are kept under your name.';
  const manage = 'You can change your name or password, or delete the account, on Your account.';
  return {
    to: person.email,
    subject: 'Your Marlow account is open',
    text: [
      greeting,
      '',
      opened,
      kept,
      manage,
      '',
      `Your account: ${accountUrl}`,
      '',
      NOT_YOU_ACCOUNT,
    ].join('\n'),
    html: layout({
      preheader: opened,
      heading: 'Your account is open',
      body: `
        <p style="${P}">${escape(greeting)}</p>
        <p style="${P}">${escape(opened)} ${kept}</p>
        <p style="${P}">${manage}</p>`,
      action: { label: 'Go to your account', href: accountUrl },
      footnote: NOT_YOU_ACCOUNT,
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
  const link = webAddress(request.link);
  const wording = LINK_WORDING[request.kind];
  const lasts = `The link works for ${request.minutes} minutes.`;
  return {
    to: request.to,
    subject: wording.subject,
    text: [wording.lede, lasts, '', link, '', wording.notYou].join('\n'),
    html: layout({
      preheader: `${wording.lede} ${lasts}`,
      heading: wording.heading,
      body: `<p style="${P}">${wording.lede} ${lasts}</p>`,
      action: { label: wording.action, href: link },
      footnote: wording.notYou,
    }),
  };
}

const CODE_WORDING: Record<AuthPurpose, string> = {
  'forget-password': 'Use this code to choose a new password for your Marlow account.',
  'email-verification': 'Use this code to confirm the email address of your Marlow account.',
  'sign-in': 'Use this code to sign in to your Marlow account.',
};

export function authCodeEmail(request: AuthCode): Email {
  const lede = CODE_WORDING[request.kind];
  const lasts = `It works for ${request.minutes} minutes.`;
  const notYou = 'If you did not ask for it, ignore this email.';
  return {
    to: request.to,
    subject: `Your Marlow code: ${request.code}`,
    text: [lede, '', request.code, '', lasts, notYou].join('\n'),
    html: layout({
      preheader: `${request.code}. ${lasts}`,
      heading: 'Your code',
      body: `
        <p style="${P}">${lede}</p>
        <p style="margin:0 0 16px;font-size:28px;letter-spacing:0.2em;font-variant-numeric:tabular-nums">${escape(request.code)}</p>
        <p style="${P}">${lasts}</p>`,
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
const P = 'margin:0 0 16px;';
const CELL = `padding:12px 0;border-bottom:1px solid ${HAIRLINE};vertical-align:top;`;

function layout(parts: {
  preheader: string;
  heading: string;
  body: string;
  action?: { label: string; href: string };
  footnote: string;
}): string {
  const action = parts.action
    ? `<p style="margin:24px 0">
        <a href="${escape(parts.action.href)}" style="display:inline-block;padding:14px 24px;background:${INK};color:#ffffff;text-decoration:none;font-weight:500">${escape(parts.action.label)}</a>
      </p>`
    : '';
  return `<!doctype html>
<html lang="en">
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
