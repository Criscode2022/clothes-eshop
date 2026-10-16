import { asLocale } from '../i18n/locale';
import type { Locale } from '../i18n/locale';
import { isCategorySlug, SEED_PRODUCTS } from './catalog';
import type { Product } from './catalog';
import { DELIVERY_METHODS, PAYMENT_METHODS } from './checkout';
import type { DeliveryMethod, PaymentMethodId, ShippingDetails, ShopOrder } from './checkout';
import { FULFILLMENT_STATES } from './fulfillment';
import type { Fulfillment } from './fulfillment';
import { careOf, compositionOf } from './cloth';
import { installShop, snapshotShop } from './order-book';

const SEED_ORDER = SEED_PRODUCTS.map((product) => product.id);
const SIZE_ORDER = ['S', 'M', 'L', '46', '48', '50'];

export interface ProductRecord {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly price_cents: number | string;
  readonly summary: string;
  readonly composition: string | null;
  readonly care: string | null;
}

export interface VariantRecord {
  readonly product_slug: string;
  readonly slug: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number | string;
}

export interface OrderRecord {
  readonly id: string;
  readonly reference: string;
  readonly client_id: string | null;
  readonly contact_name: string;
  readonly contact_email: string;
  readonly contact_phone: string;
  readonly delivery: string;
  /** The address columns are null for an order picked up at the shop. */
  readonly ship_line1: string | null;
  readonly ship_city: string | null;
  /** Null for orders placed before regions were asked, and where the country has none. */
  readonly ship_region: string | null;
  readonly ship_postal_code: string | null;
  readonly ship_country: string | null;
  readonly subtotal_cents: number | string;
  readonly shipping_cents: number | string;
  readonly total_cents: number | string;
  readonly payment_method: string;
  readonly fulfillment: string;
  /** The driver returns a timestamp as a Date or as text, depending on how it parses types. */
  readonly paid_at: string | Date | null;
  readonly created_at: string | Date;
  /** Absent on a row read before the column existed. Those orders are English. */
  readonly locale?: string | null;
}

export interface LineRecord {
  readonly order_id: string;
  readonly product_name: string;
  readonly size: string;
  readonly color: string;
  readonly quantity: number | string;
  readonly unit_price_cents: number | string;
  readonly line_cents: number | string;
}

type Query = <T>(strings: TemplateStringsArray, ...values: readonly unknown[]) => Promise<T[]>;

let tail: Promise<void> = Promise.resolve();

/** One pull or push at a time, so two requests cannot interleave a read and a write. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = tail.then(job, job);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Runs other database work in the same line as pulls and pushes, so it never lands between them. */
export function inShopDatabaseQueue<T>(job: () => Promise<T>): Promise<T> {
  return enqueue(job);
}

export function shopDatabaseConfigured(): boolean {
  return Boolean(process.env['DATABASE_URL']);
}

export function reportShopError(error: unknown): void {
  const raw = error instanceof Error ? error.message : 'shop record error';
  console.error(
    raw
      .replace(/postgres(?:ql)?:\/\/\S+/gi, '[database]')
      .replace(/npg_[A-Za-z0-9_-]+/g, '[secret]')
      .slice(0, 300),
  );
}

/** The language last asked for an address, for a process that has no database yet. */
const localeByEmail = new Map<string, Locale>();

/**
 * Remembers a language for later emails. A signed-in person is stored by id. A password reset, which
 * has no session, is stored by email. A guest with neither is left to the cookie.
 */
export async function rememberShopLocale(input: {
  locale: Locale;
  userId?: string | null;
  email?: string | null;
}): Promise<void> {
  const email = input.email?.trim().toLowerCase() ?? '';
  if (email) {
    localeByEmail.set(email, input.locale);
  }
  const sql = await sqlClient();
  if (!sql) {
    return;
  }
  if (input.userId) {
    await sql`update public.profiles set locale = ${input.locale} where id = ${input.userId}::uuid`;
    return;
  }
  if (email) {
    await sql`
      update public.profiles
      set locale = ${input.locale}
      where id = (select id from neon_auth.user where lower(email) = ${email})
    `;
  }
}

/** The language to write to this address: the profile, then this process, then English. */
export async function localeForShopEmail(email: string): Promise<Locale> {
  const key = email.trim().toLowerCase();
  const sql = await sqlClient();
  if (sql && key) {
    try {
      const rows = await sql<{ locale: string | null }>`
        select profiles.locale as locale
        from public.profiles as profiles
        join neon_auth.user as account on account.id = profiles.id
        where lower(account.email) = ${key}
      `;
      const locale = rows[0]?.locale;
      if (locale === 'en' || locale === 'es') {
        return locale;
      }
    } catch (error) {
      reportShopError(error);
    }
  }
  return localeByEmail.get(key) ?? 'en';
}

/** Rebuilds the floor from slug rows. Seeded pieces stay in floor order so the index lead does not move. */
export function productsFromRows(
  productRows: readonly ProductRecord[],
  variantRows: readonly VariantRecord[],
): Product[] {
  const variantsByProduct = new Map<string, VariantRecord[]>();
  for (const row of variantRows) {
    const list = variantsByProduct.get(row.product_slug) ?? [];
    list.push(row);
    variantsByProduct.set(row.product_slug, list);
  }
  const products: Product[] = [];
  for (const row of productRows) {
    if (!isCategorySlug(row.category) || !row.slug) {
      continue;
    }
    const variants = [...(variantsByProduct.get(row.slug) ?? [])].sort(compareVariants);
    products.push({
      id: row.slug,
      name: row.name,
      category: row.category,
      priceCents: whole(row.price_cents),
      summary: row.summary,
      composition: row.composition ?? '',
      care: row.care ?? '',
      variants: variants.map((variant) => ({
        id: variant.slug,
        size: variant.size,
        color: variant.color,
        stock: whole(variant.stock),
      })),
    });
  }
  return products.sort(compareProducts);
}

export function ordersFromRows(
  orderRows: readonly OrderRecord[],
  lineRows: readonly LineRecord[],
  products: readonly Product[],
): ShopOrder[] {
  const linesByOrder = new Map<string, LineRecord[]>();
  for (const row of lineRows) {
    const list = linesByOrder.get(row.order_id) ?? [];
    list.push(row);
    linesByOrder.set(row.order_id, list);
  }
  const orders: ShopOrder[] = [];
  for (const row of orderRows) {
    const delivery = deliveryOf(row.delivery);
    const paymentMethod = paymentOf(row.payment_method);
    const fulfillment = fulfillmentOf(row.fulfillment);
    if (!delivery || !paymentMethod || !fulfillment) {
      continue;
    }
    orders.push({
      reference: row.reference,
      clientId: row.client_id,
      contact: { name: row.contact_name, email: row.contact_email, phone: row.contact_phone },
      delivery,
      shipping: delivery === 'ship' ? shippingOf(row) : null,
      lines: (linesByOrder.get(row.id) ?? []).map((line) => {
        const identity = lineIdentity(products, line.product_name, line.size, line.color);
        return {
          productId: identity.productId,
          variantId: identity.variantId,
          name: line.product_name,
          size: line.size,
          color: line.color,
          quantity: whole(line.quantity),
          unitPriceCents: whole(line.unit_price_cents),
          lineCents: whole(line.line_cents),
        };
      }),
      subtotalCents: whole(row.subtotal_cents),
      shippingCents: whole(row.shipping_cents),
      totalCents: whole(row.total_cents),
      paymentMethod,
      fulfillment,
      paidAt: row.paid_at === null ? null : new Date(row.paid_at).toISOString(),
      placedAt: new Date(row.created_at).toISOString(),
      locale: asLocale(row.locale),
    });
  }
  return orders;
}

export function referenceAfter(orders: readonly { reference: string }[]): number {
  let next = 1001;
  for (const order of orders) {
    const match = /^MR-(\d+)$/.exec(order.reference);
    if (match) {
      next = Math.max(next, Number(match[1]) + 1);
    }
  }
  return next;
}

export function pullNeon(): Promise<void> {
  return enqueue(async () => {
    const sql = await sqlClient();
    if (!sql) {
      return;
    }
    const productRows = await sql<ProductRecord>`
      select slug, name, category, price_cents, summary, composition, care
      from public.products
    `;
    const variantRows = await sql<VariantRecord>`
      select products.slug as product_slug, variants.slug, variants.size, variants.color, variants.stock
      from public.variants as variants
      join public.products as products on products.id = variants.product_id
    `;
    const orderRows = await sql<OrderRecord>`
      select id, reference, client_id, contact_name, contact_email, contact_phone, delivery,
             ship_line1, ship_city, ship_region, ship_postal_code, ship_country,
             subtotal_cents, shipping_cents, total_cents, payment_method, fulfillment, paid_at,
             created_at, locale
      from public.orders
    `;
    const lineRows = await sql<LineRecord>`
      select order_id, product_name, size, color, quantity, unit_price_cents, line_cents
      from public.order_lines
    `;
    const products = productsFromRows(productRows, variantRows);
    const orders = ordersFromRows(orderRows, lineRows, products);
    installShop({ products, orders, nextReference: referenceAfter(orders) });
  });
}

export function pushNeon(): Promise<void> {
  return enqueue(async () => {
    const sql = await sqlClient();
    if (!sql) {
      return;
    }
    const state = snapshotShop();
    for (const product of state.products) {
      await writeProduct(sql, product);
    }
    for (const order of state.orders) {
      await writeOrder(sql, order);
    }
  });
}

async function writeProduct(sql: Query, product: Product): Promise<void> {
  const composition = compositionOf(product);
  const care = careOf(product);
  const updated = await sql<{ id: string }>`
    update public.products
    set name = ${product.name},
        category = ${product.category},
        price_cents = ${product.priceCents},
        summary = ${product.summary},
        composition = ${composition},
        care = ${care}
    where slug = ${product.id}
    returning id
  `;
  const inserted =
    updated[0] ??
    (
      await sql<{ id: string }>`
        insert into public.products (slug, name, category, price_cents, summary, composition, care)
        values (
          ${product.id},
          ${product.name},
          ${product.category},
          ${product.priceCents},
          ${product.summary},
          ${composition},
          ${care}
        )
        returning id
      `
    )[0];
  if (!inserted) {
    throw new Error('The shop could not store a piece.');
  }
  for (const variant of product.variants) {
    const changed = await sql<{ id: string }>`
      update public.variants
      set stock = ${variant.stock}, size = ${variant.size}, color = ${variant.color}, product_id = ${inserted.id}::uuid
      where slug = ${variant.id}
      returning id
    `;
    if (changed.length > 0) {
      continue;
    }
    await sql`
      insert into public.variants (product_id, slug, size, color, stock)
      values (${inserted.id}::uuid, ${variant.id}, ${variant.size}, ${variant.color}, ${variant.stock})
    `;
  }
}

async function writeOrder(sql: Query, order: ShopOrder): Promise<void> {
  const existing = await sql<{ id: string; fulfillment: string; paid_at: string | Date | null }>`
    select id, fulfillment, paid_at from public.orders where reference = ${order.reference}
  `;
  const current = existing[0];
  if (current) {
    if (
      current.fulfillment !== order.fulfillment ||
      (current.paid_at === null) !== (order.paidAt === null)
    ) {
      await sql`
        update public.orders
        set fulfillment = ${order.fulfillment}, paid_at = ${order.paidAt}::timestamptz
        where reference = ${order.reference}
      `;
    }
    return;
  }
  const inserted = await sql<{ id: string }>`
    insert into public.orders (
      reference, client_id, contact_name, contact_email, contact_phone, delivery,
      ship_line1, ship_city, ship_region, ship_postal_code, ship_country,
      subtotal_cents, shipping_cents, total_cents, payment_method, fulfillment, paid_at, created_at,
      locale
    )
    values (
      ${order.reference},
      (select id from neon_auth.user where id = ${order.clientId}::uuid),
      ${order.contact.name},
      ${order.contact.email},
      ${order.contact.phone},
      ${order.delivery},
      ${order.shipping?.line1 ?? null},
      ${order.shipping?.city ?? null},
      ${order.shipping?.region || null},
      ${order.shipping?.postalCode ?? null},
      ${order.shipping?.country ?? null},
      ${order.subtotalCents},
      ${order.shippingCents},
      ${order.totalCents},
      ${order.paymentMethod},
      ${order.fulfillment},
      ${order.paidAt}::timestamptz,
      ${order.placedAt}::timestamptz,
      ${asLocale(order.locale)}
    )
    returning id
  `;
  const orderId = inserted[0]?.id;
  if (!orderId) {
    throw new Error('The shop could not store an order.');
  }
  for (const line of order.lines) {
    await sql`
      insert into public.order_lines (order_id, product_name, size, color, quantity, unit_price_cents, line_cents)
      values (
        ${orderId}::uuid,
        ${line.name},
        ${line.size},
        ${line.color},
        ${line.quantity},
        ${line.unitPriceCents},
        ${line.lineCents}
      )
    `;
  }
}

async function sqlClient(): Promise<Query | null> {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    return null;
  }
  const { neon } = await import('@neondatabase/serverless');
  return neon(url) as Query;
}

function compareProducts(left: Product, right: Product): number {
  return (
    rank(SEED_ORDER, left.id) - rank(SEED_ORDER, right.id) || left.name.localeCompare(right.name)
  );
}

function compareVariants(left: VariantRecord, right: VariantRecord): number {
  return (
    rank(SIZE_ORDER, left.size) - rank(SIZE_ORDER, right.size) ||
    left.color.localeCompare(right.color)
  );
}

function rank(order: readonly string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

function whole(value: number | string): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error('The shop records returned a value that is not a number.');
  }
  return Math.trunc(number);
}

function deliveryOf(value: string): DeliveryMethod | null {
  return DELIVERY_METHODS.some((method) => method.id === value) ? (value as DeliveryMethod) : null;
}

/** A shipped order's address; the columns are set together, as the table's check requires. */
function shippingOf(row: OrderRecord): ShippingDetails {
  return {
    line1: row.ship_line1 ?? '',
    city: row.ship_city ?? '',
    region: row.ship_region ?? '',
    postalCode: row.ship_postal_code ?? '',
    country: row.ship_country ?? '',
  };
}

function paymentOf(value: string): PaymentMethodId | null {
  return PAYMENT_METHODS.some((method) => method.id === value) ? (value as PaymentMethodId) : null;
}

function fulfillmentOf(value: string): Fulfillment | null {
  return (FULFILLMENT_STATES as readonly string[]).includes(value) ? (value as Fulfillment) : null;
}

function lineIdentity(
  products: readonly Product[],
  name: string,
  size: string,
  color: string,
): { productId: string; variantId: string } {
  const product = products.find((item) => item.name === name);
  const variant = product?.variants.find((item) => item.size === size && item.color === color);
  if (product && variant) {
    return { productId: product.id, variantId: variant.id };
  }
  const fallback = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    productId: product?.id ?? fallback,
    variantId: `${fallback}-${size}-${color}`.toLowerCase(),
  };
}
