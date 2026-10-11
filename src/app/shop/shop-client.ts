import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Actor } from './access';
import { ShopRuleError } from './cart';
import type { CartLine } from './cart';
import type { ContactDetails, Fulfillment, ShippingDetails, ShopOrder } from './checkout';
import type { Product } from './catalog';
import { CatalogStore } from './catalog-store';
import { NeonAuth } from './neon-auth';
import { accountKindOf } from './session-tokens';
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
  private readonly neon = inject(NeonAuth);
  private readonly document = inject(DOCUMENT);

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

  /** The server sends the "your account is open" email when it sees a session that follows a sign-up. */
  async signUpWithNeon(name: string, email: string, password: string): Promise<Actor> {
    return this.adoptNeon(await this.neonToken('sign-up', email, password, name), true);
  }

  async signOut(): Promise<void> {
    const neon = accountKindOf(this.session.token()) === 'neon';
    await this.request<{ signedOut: boolean }>('DELETE', '/api/session', null, true);
    this.session.clear();
    if (neon) {
      await this.signOutOfNeon();
    }
  }

  async renameAccount(name: string): Promise<Actor> {
    const response = await this.request<{ actor: Actor }>('PATCH', '/api/account', { name }, true);
    this.session.adopt(response.actor, this.session.token());
    return response.actor;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.neonCall(() =>
      this.neon.changePassword(this.signedInEmail(), currentPassword, newPassword),
    );
  }

  /**
   * Signing in again with the password proves it is the person, not a forgotten open tab. The server
   * checks that fresh sign-in before it unlinks the orders and removes the account.
   */
  async deleteAccount(password: string): Promise<void> {
    const token = await this.neonToken('sign-in', this.signedInEmail(), password);
    await this.request<{ deleted: boolean }>('DELETE', '/api/account', { token }, true);
    this.session.clear();
    await this.signOutOfNeon();
  }

  /** The link in the email comes back to this shop's reset page. */
  requestPasswordReset(email: string): Promise<void> {
    const redirectTo = `${this.document.location.origin}/reset-password`;
    return this.neonCall(() => this.neon.requestPasswordReset(email, redirectTo));
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return this.neonCall(() => this.neon.resetPassword(token, newPassword));
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

  private async adoptNeon(token: string, signedUp = false): Promise<Actor> {
    const response = await this.request<SessionResponse>(
      'POST',
      '/api/session/neon',
      { token, signedUp },
      false,
    );
    this.session.adopt(response.actor, response.token);
    return response.actor;
  }

  private neonToken(
    mode: 'sign-in' | 'sign-up',
    email: string,
    password: string,
    name = '',
  ): Promise<string> {
    return this.neonCall(() => this.neon.sessionToken(mode, email, password, name));
  }

  /** Neon Auth's errors reach the page as the shop's own, with Neon's message when it gives one. */
  private async neonCall<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof ShopRuleError) {
        throw error;
      }
      throw new ShopRuleError(
        error instanceof Error && error.message
          ? error.message
          : 'Neon Auth could not finish that.',
      );
    }
  }

  private async signOutOfNeon(): Promise<void> {
    try {
      await this.neon.signOut();
    } catch {
      // The shop session is already gone. The auth cookie expires on its own.
    }
  }

  private signedInEmail(): string {
    const email = this.session.current()?.email;
    if (!email) {
      throw new ShopRuleError('Sign in to change your account.');
    }
    return email;
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
