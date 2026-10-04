import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Actor } from './access';
import { ShopRuleError } from './cart';
import type { CartLine } from './cart';
import type { ContactDetails, Fulfillment, ShippingDetails, ShopOrder } from './checkout';
import type { Product } from './catalog';
import { CatalogStore } from './catalog-store';
import { neonAuthSignOut, neonAuthToken } from './neon-browser';
import { ShopSession } from './shop-session';

export interface PlaceOrderBody {
  readonly contact: ContactDetails;
  readonly shipping: ShippingDetails;
  readonly paymentMethod: string;
  readonly lines: readonly CartLine[];
}

interface SessionResponse {
  readonly token: string;
  readonly actor: Actor;
}

@Service()
export class ShopClient {
  private readonly http = inject(HttpClient);
  private readonly session = inject(ShopSession);
  private readonly catalog = inject(CatalogStore);

  async signIn(email: string, password: string): Promise<Actor> {
    const response = await this.request<SessionResponse>(
      'POST',
      '/api/session',
      { email, password },
      false,
    );
    this.session.adopt(response.actor, response.token);
    return response.actor;
  }

  async signInWithNeon(email: string, password: string): Promise<Actor> {
    return this.adoptNeon(await this.neonToken('sign-in', email, password));
  }

  async signUpWithNeon(name: string, email: string, password: string): Promise<Actor> {
    return this.adoptNeon(await this.neonToken('sign-up', email, password, name));
  }

  async signOut(): Promise<void> {
    const neon = this.session.token().startsWith('session-');
    await this.request<{ signedOut: boolean }>('DELETE', '/api/session', null, true);
    this.session.clear();
    if (neon) {
      try {
        await neonAuthSignOut();
      } catch {
        // The shop session is already gone. The auth cookie expires on its own.
      }
    }
  }

  placeOrder(body: PlaceOrderBody): Promise<ShopOrder> {
    return this.request<ShopOrder>('POST', '/api/orders', body, true);
  }

  listOrders(): Promise<ShopOrder[]> {
    return this.request<ShopOrder[]>('GET', '/api/orders', null, true);
  }

  /** Fetches the floor as the server holds it now, and shows it everywhere the catalog appears. */
  async loadCatalog(): Promise<Product[]> {
    const products = await this.request<Product[]>('GET', '/api/catalog', null, false);
    this.catalog.replaceAll(products);
    return products;
  }

  order(reference: string): Promise<ShopOrder> {
    return this.request<ShopOrder>(
      'GET',
      `/api/orders/${encodeURIComponent(reference)}`,
      null,
      true,
    );
  }

  moveFulfillment(reference: string, fulfillment: Fulfillment): Promise<ShopOrder> {
    return this.request<ShopOrder>(
      'POST',
      `/api/orders/${encodeURIComponent(reference)}/fulfillment`,
      { fulfillment },
      true,
    );
  }

  async setStock(variantId: string, stock: number): Promise<Product> {
    const product = await this.request<Product>(
      'POST',
      `/api/variants/${encodeURIComponent(variantId)}/stock`,
      { stock },
      true,
    );
    this.catalog.replace(product);
    return product;
  }

  async setPrice(productId: string, priceCents: number): Promise<Product> {
    const product = await this.request<Product>(
      'POST',
      `/api/products/${encodeURIComponent(productId)}/price`,
      { priceCents },
      true,
    );
    this.catalog.replace(product);
    return product;
  }

  async createProduct(body: {
    name: string;
    category: string;
    priceCents: number;
    summary: string;
    size: string;
    color: string;
    stock: number;
  }): Promise<Product> {
    const product = await this.request<Product>('POST', '/api/products', body, true);
    this.catalog.replace(product);
    return product;
  }

  async addVariant(
    productId: string,
    size: string,
    color: string,
    stock: number,
  ): Promise<Product> {
    const product = await this.request<Product>(
      'POST',
      `/api/products/${encodeURIComponent(productId)}/variants`,
      { size, color, stock },
      true,
    );
    this.catalog.replace(product);
    return product;
  }

  private async adoptNeon(token: string): Promise<Actor> {
    const response = await this.request<SessionResponse>(
      'POST',
      '/api/session/neon',
      { token },
      false,
    );
    this.session.adopt(response.actor, response.token);
    return response.actor;
  }

  private async neonToken(
    mode: 'sign-in' | 'sign-up',
    email: string,
    password: string,
    name = '',
  ): Promise<string> {
    try {
      return await neonAuthToken(mode, email, password, name);
    } catch (error) {
      if (error instanceof ShopRuleError) {
        throw error;
      }
      throw new ShopRuleError(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    withSession: boolean,
  ): Promise<T> {
    try {
      return await firstValueFrom(
        this.http.request<T>(method, path, {
          body: body ?? undefined,
          headers: withSession ? this.headers() : undefined,
        }),
      );
    } catch (error) {
      throw new ShopRuleError(messageFrom(error));
    }
  }

  private headers(): HttpHeaders {
    const token = this.session.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body['message'] === 'string'
    ) {
      return body['message'];
    }
    return 'The shop could not finish that.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'The shop could not finish that.';
}
