import type { ShopOrder } from '../app/shop/checkout';
import type { NeonIdentity } from '../app/shop/neon-adopt';
import type { Mailer } from './mailer';
import { accountCreatedEmail, authCodeEmail, authLinkEmail, orderPlacedEmail } from './shop-emails';
import type { AuthPurpose } from './shop-emails';

/** An account older than this was not just created, whatever the browser says. */
const NEW_ACCOUNT_MS = 30 * 60_000;

export interface AuthDelivery {
  readonly kind: AuthPurpose;
  readonly to: string;
  /** When the link or code stops working, in milliseconds. */
  readonly expiresAt: number;
}

/**
 * The emails the shop sends, and when. Order and welcome emails never get in the way of the request
 * that caused them; a sign-in email reports failure, because Neon Auth retries it.
 */
export class ShopMail {
  private readonly welcomed = new Set<string>();

  constructor(
    private readonly mailer: Mailer,
    private readonly shopUrl: string,
    private readonly report: (error: unknown) => void,
    private readonly now: () => number = Date.now,
  ) {}

  get description(): string {
    return this.mailer.description;
  }

  /** `transferPath` is the signed link to the simulated bank, for an order paid by bank transfer. */
  async orderPlaced(order: ShopOrder, transferPath: string | null): Promise<void> {
    await this.sendQuietly(() =>
      this.mailer.send(orderPlacedEmail(order, this.shopUrl, transferPath)),
    );
  }

  /** "Your account is open": sent once, straight after a sign-up. It asks the person to confirm nothing. */
  async accountCreated(identity: NeonIdentity, signedUp: boolean): Promise<void> {
    const { actor, createdAt } = identity;
    const justCreated = createdAt === null || this.now() - createdAt <= NEW_ACCOUNT_MS;
    if (!signedUp || !justCreated || this.welcomed.has(actor.id)) {
      return;
    }
    this.welcomed.add(actor.id);
    await this.sendQuietly(() => this.mailer.send(accountCreatedEmail(actor, this.shopUrl)));
  }

  async authLink(delivery: AuthDelivery & { readonly link: string }): Promise<void> {
    await this.mailer.send(
      authLinkEmail({ ...delivery, minutes: this.minutesLeft(delivery.expiresAt) }),
    );
  }

  async authCode(delivery: AuthDelivery & { readonly code: string }): Promise<void> {
    await this.mailer.send(
      authCodeEmail({ ...delivery, minutes: this.minutesLeft(delivery.expiresAt) }),
    );
  }

  private minutesLeft(expiresAt: number): number {
    return Math.max(1, Math.round((expiresAt - this.now()) / 60_000));
  }

  private async sendQuietly(send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch (error) {
      this.report(error);
    }
  }
}
