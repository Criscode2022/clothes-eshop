import { Component, inject, signal } from '@angular/core';
import { email, form, minLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import type { ShopRole } from '../../shop/access';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/** The demo people who open each part of the shop. They share one floor password; none of this is a secret. */
const FLOOR_ACCOUNTS: readonly {
  readonly name: string;
  readonly email: string;
  readonly role: ShopRole;
}[] = [
  { name: 'Avery Cole', email: 'avery@marlow.shop', role: 'client' },
  { name: 'Noah Pell', email: 'noah@marlow.shop', role: 'client' },
  { name: 'Jordan Hale', email: 'jordan@marlow.shop', role: 'worker' },
  { name: 'Sloan Marlow', email: 'sloan@marlow.shop', role: 'owner' },
];
const FLOOR_PASSWORD = 'marlow-floor';

const LANDING: Record<ShopRole, string> = {
  client: '/account/orders',
  worker: '/desk',
  owner: '/owner',
};

/** What each floor account opens, as the button says it. */
const OPENS: Record<ShopRole, string> = {
  client: 'Client',
  worker: 'Desk',
  owner: 'Backoffice',
};

@Component({
  selector: 'app-sign-in',
  imports: [
    HlmAlertImports,
    HlmBadge,
    HlmItemImports,
    HlmSpinner,
    NgIcon,
    RouterLink,
    ShopButtonImports,
    TextField,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideCircleAlert })],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);

  protected readonly floorAccounts = FLOOR_ACCOUNTS;
  protected readonly floorPassword = FLOOR_PASSWORD;
  protected readonly signingIn = signal(false);
  protected readonly creating = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly accountMessage = signal('');
  protected readonly model = signal({ email: '', password: '' });
  protected readonly accountModel = signal({ name: '', email: '', password: '' });
  protected readonly signInForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter an email address, like name@example.com.' });
    required(path.password, { message: 'Enter your password.' });
    minLength(path.password, 8, { message: 'Passwords have at least 8 characters.' });
  });
  protected readonly accountForm = form(this.accountModel, (path) => {
    required(path.name, { message: 'Enter your name.' });
    minLength(path.name, 2, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter an email address, like name@example.com.' });
    required(path.password, { message: 'Choose a password of at least 8 characters.' });
    minLength(path.password, 8, { message: 'Choose a password of at least 8 characters.' });
  });

  protected opens(role: ShopRole): string {
    return OPENS[role];
  }

  protected useFloorAccount(address: string): void {
    this.model.set({ email: address, password: FLOOR_PASSWORD });
    this.signIn();
  }

  protected signIn(): void {
    this.errorMessage.set('');
    void submit(this.signInForm, async () => {
      this.signingIn.set(true);
      try {
        await this.enter(await this.signInAnywhere());
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'Sign-in failed.');
      } finally {
        this.signingIn.set(false);
      }
    });
  }

  protected createAccount(): void {
    this.accountMessage.set('');
    void submit(this.accountForm, async () => {
      this.creating.set(true);
      const account = this.accountModel();
      try {
        await this.enter(
          await this.shop.signUpWithNeon(account.name, account.email, account.password),
        );
      } catch (error) {
        this.accountMessage.set(
          error instanceof Error ? error.message : 'The account could not be created.',
        );
      } finally {
        this.creating.set(false);
      }
    });
  }

  /** Floor accounts first, then Neon Auth. The Neon message wins because a real account is the likelier intent. */
  private async signInAnywhere(): Promise<{ role: ShopRole }> {
    const { email: address, password } = this.model();
    try {
      return await this.shop.signIn(address, password);
    } catch (floorError) {
      try {
        return await this.shop.signInWithNeon(address, password);
      } catch (neonError) {
        const message =
          (neonError instanceof Error && neonError.message) ||
          (floorError instanceof Error && floorError.message);
        throw new Error(message || 'Sign-in failed.');
      }
    }
  }

  private async enter(actor: { role: ShopRole }): Promise<void> {
    await this.router.navigateByUrl(LANDING[actor.role]);
  }
}
