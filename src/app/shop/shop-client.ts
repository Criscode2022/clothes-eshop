import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Actor } from './access';
import type { TransferDetails } from './bank-transfer';
import { ShopRuleError } from './cart';
import type { CartLine } from './cart';
import type { ContactDetails, Fulfillment, ShippingDetails, ShopOrder } from './checkout';
import type { Product } from './catalog';
import { CatalogStore } from './catalog-store';
import { NeonAuth } from './neon-auth';
import { SavedSession } from './saved-session';
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
  private readonly saved = inject(SavedSession);
  private readonly document = inject(DOCUMENT);
  private resumed: Promise<void> | null = null;

  async signInWithNeon(email: string, password: string): Promise<Actor> {
    return this.adoptNeon(await this.neonToken('sign-in', email, password));
  }

  /** The server sends the "your account is open" email when it sees a session that follows a sign-up. */
  async signUpWithNeon(name: string, email: string, password: string): Promise<Actor> {
    return this.adoptNeon(await this.neonToken('sign-up', email, password, name), true);
  }

  /**
   * After a reload, brings back the session this browser saved, or, once a Neon session has run out,
   * the account Neon Auth's cookie still holds. It runs once per page load, and guards wait for it, so
   * a reload on a signed-in page does not bounce to sign-in.
   */
  resumeSession(): Promise<void> {
    this.resumed ??= this.restoreSession();
    return this.resumed;
  }

  /** The session is a signed token the browser holds, so forgetting it here is signing out of the shop. */
  async signOut(): Promise<void> {
    this.session.clear();
    this.saved.forget();
    await this.signOutOfNeon();
  }

  /** The session carries the name, so the server answers with one under the new name. */
  async renameAccount(name: string): Promise<Actor> {
    return this.adopt(await this.request<SessionResponse>('PATCH', '/api/account', { name }, true));
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
    this.saved.forget();
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

  async moveFulfillment(reference: string, fulfillment: Fulfillment): Promise<ShopOrder> {
    const order = await this.request<ShopOrder>(
      'POST',
      `/api/orders/${encodeURIComponent(reference)}/fulfillment`,
      { fulfillment },
      true,
    );
    this.refreshFloorAfter(order);
    return order;
  }

  async cancelOrder(reference: string): Promise<ShopOrder> {
    const order = await this.request<ShopOrder>(
      'POST',
      `/api/orders/${encodeURIComponent(reference)}/cancel`,
      {},
      true,
    );
    this.refreshFloorAfter(order);
    return order;
  }

  /** What the simulated bank pays, at the link the order's email carried. No session: the code is the proof. */
  transfer(reference: string, code: string): Promise<TransferDetails> {
    return this.request<TransferDetails>('GET', transferPath(reference, code), null, false);
  }

  sendTransfer(reference: string, code: string): Promise<TransferDetails> {
    return this.request<TransferDetails>('POST', transferPath(reference, code), {}, false);
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

  /** A cancelled order's pieces are back on the floor, so the floor's stock is read again. */
  private refreshFloorAfter(order: ShopOrder): void {
    if (order.fulfillment === 'cancelled') {
      this.loadCatalog().catch(() => {
        // The floor shows the old stock until its next load; the cancel itself went through.
      });
    }
  }

  private adopt(response: SessionResponse): Actor {
    this.session.adopt(response.actor, response.token);
    this.saved.save(response.token);
    return response.actor;
  }

  private async adoptNeon(token: string, signedUp = false): Promise<Actor> {
    return this.adopt(
      await this.request<SessionResponse>('POST', '/api/session/neon', { token, signedUp }, false),
    );
  }

  private async restoreSession(): Promise<void> {
    const saved = this.saved.token();
    if (this.session.isSignedIn() || !saved) {
      return;
    }
    try {
      const session = await this.savedSessionOf(saved);
      if (session) {
        this.adopt(session);
      } else {
        await this.resumeNeonSession();
      }
    } catch {
      // The shop or Neon Auth did not answer. The visitor stays signed out, and the next load asks again.
    }
  }

  /** The shop's answer for a saved token: whose session it is, or null once it has ended. */
  private async savedSessionOf(token: string): Promise<SessionResponse | null> {
    try {
      return await firstValueFrom(
        this.http.get<SessionResponse>('/api/session', { headers: bearer(token) }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return null;
      }
      throw error;
    }
  }

  /** Neon Auth's cookie outlives the shop's Neon session; when it holds no account, the saved one goes. */
  private async resumeNeonSession(): Promise<void> {
    const token = await this.neon.currentSessionToken();
    if (token) {
      await this.adoptNeon(token);
    } else {
      this.saved.forget();
    }
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

  /**
   * A call made as the signed-in person waits for a reload's session first. Otherwise a page that
   * loads at once, such as an order, asks before the session is back: a client's order reads as not
   * theirs, and a new one would be stored as a guest's.
   */
  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    withSession: boolean,
  ): Promise<T> {
    if (withSession) {
      await this.resumeSession();
    }
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
    return bearer(this.session.token());
  }
}

function transferPath(reference: string, code: string): string {
  return `/api/transfers/${encodeURIComponent(reference)}/${encodeURIComponent(code)}`;
}

function bearer(token: string): HttpHeaders {
  return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
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
