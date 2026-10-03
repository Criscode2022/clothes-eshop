import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adoptNeonSession } from './app/shop/neon-adopt';
import { pullNeon, pushNeon, reportShopError, shopDatabaseConfigured } from './app/shop/neon-book';
import { handleShopHttp } from './app/shop/shop-server';

loadLocalEnv();

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

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
    return adoptNeonSession(body);
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
  return result;
}

function writesShop(method: string, path: string, status: number): boolean {
  if (status >= 400) {
    return false;
  }
  const verb = method.toUpperCase();
  if (verb === 'GET' || verb === 'HEAD' || verb === 'DELETE') {
    return false;
  }
  return path.startsWith('/api/orders') || path.startsWith('/api/products') || path.startsWith('/api/variants');
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
