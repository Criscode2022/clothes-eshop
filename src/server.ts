import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleAccountHttp } from './app/shop/account-server';
import type { AccountServerDeps } from './app/shop/account-server';
import type { ShopOrder } from './app/shop/checkout';
import { neonAccountDirectory } from './app/shop/neon-accounts';
import { adoptNeonSession, verifyFreshNeonSignIn } from './app/shop/neon-adopt';
import { relayNeonAuth } from './app/shop/neon-auth-relay';
import { pullNeon, pushNeon, reportShopError, shopDatabaseConfigured } from './app/shop/neon-book';
import { NEON_AUTH_RELAY_PATH, NEON_AUTH_URL } from './app/shop/neon-public';
import { handleShopHttp } from './app/shop/shop-server';
import { mailerFromEnv } from './mail/mailer';
import {
  DeliveredEvents,
  eventIdOf,
  handleNeonAuthEvent,
  neonAuthKeys,
  verifyNeonWebhook,
  WebhookRejected,
} from './mail/neon-auth-webhook';
import { ShopMail } from './mail/shop-mail';

loadLocalEnv();

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Gmail when GMAIL_USER and GMAIL_APP_PASSWORD are set, otherwise HTML files in tmp/mail-outbox. */
const shopMail = new ShopMail(mailerFromEnv(), shopUrl(), reportShopError);
const accounts: AccountServerDeps = {
  directory: neonAccountDirectory(),
  verifyFreshSignIn: verifyFreshNeonSignIn,
  now: Date.now,
};
const neonAuthUrl = process.env['NEON_AUTH_URL'] || NEON_AUTH_URL;
const webhookKeys = neonAuthKeys(neonAuthUrl);
const deliveredEvents = new DeliveredEvents();

/**
 * Neon Auth calls this for the emails it would otherwise send itself (password reset links, codes), and the
 * shop sends them through its own mailer. It signs the exact bytes, so the body is read as text before the
 * JSON parser below sees it. Register it for `send.magic_link` at a public HTTPS address (see APP.md).
 */
app.post('/api/neon-auth/webhook', express.text({ type: '*/*', limit: '64kb' }), (req, res) => {
  void receiveNeonAuthWebhook(req, res);
});

/**
 * Safari refuses Neon Auth's cookie on Neon's own domain, so its auth calls come through here and the
 * session cookie becomes the shop's own. Other browsers talk to Neon Auth directly. Passwords pass
 * through on their way to Neon Auth; nothing here logs or keeps them.
 */
app.use(NEON_AUTH_RELAY_PATH, express.text({ type: '*/*', limit: '64kb' }), (req, res) => {
  void relayNeonAuth(neonAuthUrl, webRequestOf(req), req.path.replace(/^\//, ''))
    .then((response) => sendWebResponse(response, res))
    .catch((error: unknown) => {
      reportShopError(error);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Neon Auth could not be reached.' });
      }
    });
});

app.use(express.json());

app.use('/api', (req, res) => {
  const path = req.originalUrl.split('?')[0] ?? req.originalUrl;
  void serveApi(req.method, path, req.body, req.header('authorization') ?? null)
    .then((result) => {
      res.status(result.status).json(result.body);
    })
    .catch((error: unknown) => {
      reportShopError(error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'The shop could not reach its records.' });
      }
    });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  const ready = shopDatabaseConfigured() ? pullNeon() : Promise.resolve();
  ready
    .then(() => angularApp.handle(req))
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch((error: unknown) => {
      reportShopError(error);
      if (!res.headersSent) {
        res.status(500).type('text/plain').send('The shop could not reach its records.');
        return;
      }
      next(error);
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log(`Mail: ${shopMail.description}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

async function serveApi(
  method: string,
  path: string,
  body: unknown,
  authorization: string | null,
): Promise<{ status: number; body: unknown }> {
  if (shopDatabaseConfigured()) {
    await pullNeon();
  }
  if (method.toUpperCase() === 'POST' && path === '/api/session/neon') {
    const adoption = await adoptNeonSession(body);
    if (adoption.identity) {
      void shopMail.accountCreated(adoption.identity, adoption.signedUp);
    }
    return adoption.result;
  }
  const account = await handleAccountHttp(method, path, body, authorization, accounts);
  if (account) {
    return account;
  }
  const result = handleShopHttp(method, path, body, authorization);
  if (shopDatabaseConfigured() && writesShop(method, path, result.status)) {
    try {
      await pushNeon();
    } catch (error) {
      await pullNeon();
      throw error;
    }
  }
  if (placesOrder(method, path, result.status)) {
    void shopMail.orderPlaced(result.body as ShopOrder);
  }
  return result;
}

/** Only a verified delivery sends email; a retry of one already handled is acknowledged and dropped. */
async function receiveNeonAuthWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event = await verifyNeonWebhook(
      typeof req.body === 'string' ? req.body : '',
      {
        signature: req.header('x-neon-signature') ?? '',
        kid: req.header('x-neon-signature-kid') ?? '',
        timestamp: req.header('x-neon-timestamp') ?? '',
      },
      webhookKeys,
    );
    const id = eventIdOf(event);
    if (id && deliveredEvents.has(id)) {
      res.status(200).end();
      return;
    }
    await handleNeonAuthEvent(event, shopMail);
    if (id) {
      deliveredEvents.add(id);
    }
    res.status(200).end();
  } catch (error) {
    if (error instanceof WebhookRejected) {
      res.status(401).end();
      return;
    }
    reportShopError(error);
    // A 5xx makes Neon Auth retry, and the person is told the email could not be sent if every try fails.
    res.status(500).end();
  }
}

function placesOrder(method: string, path: string, status: number): boolean {
  return method.toUpperCase() === 'POST' && path === '/api/orders' && status === 201;
}

/** The address links in emails point to: SHOP_URL in production, this machine otherwise. */
function shopUrl(): string {
  const configured = process.env['SHOP_URL']?.trim().replace(/\/+$/, '');
  return configured || `http://localhost:${process.env['PORT'] || 4200}`;
}

function writesShop(method: string, path: string, status: number): boolean {
  if (status >= 400) {
    return false;
  }
  const verb = method.toUpperCase();
  if (verb === 'GET' || verb === 'HEAD' || verb === 'DELETE') {
    return false;
  }
  return (
    path.startsWith('/api/orders') ||
    path.startsWith('/api/products') ||
    path.startsWith('/api/variants')
  );
}

/** Reads a gitignored `.env` when the process was not given the variables. Never logs the values. */
function loadLocalEnv(): void {
  const file = join(process.cwd(), '.env');
  if (!existsSync(file)) {
    return;
  }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Z0-9_]+$/.test(key) || process.env[key] !== undefined) {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/** The Express request as a web Request, which Neon Auth's SDK reads. Only GET and HEAD carry no body. */
function webRequestOf(req: Request): globalThis.Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(name, value);
    }
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && typeof req.body === 'string';
  return new globalThis.Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
  });
}

/** Writes a web Response to Express, keeping each Set-Cookie header separate. */
async function sendWebResponse(response: globalThis.Response, res: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie') {
      res.setHeader(name, value);
    }
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    res.setHeader('set-cookie', cookies);
  }
  res.send(Buffer.from(await response.arrayBuffer()));
}
