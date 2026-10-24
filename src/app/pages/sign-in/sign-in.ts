import { Component, inject, signal } from '@angular/core';
import { form, minLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { ShopRole } from '../../shop/access';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';
import { emailAddress, personName } from '../../ui/form-rules';

/** Where a person lands once they are in: their own orders. */
const LANDING: Record<ShopRole, string> = {
  client: '/account/orders',
  worker: '/desk',
  owner: '/owner',
};

@Component({
  selector: 'app-sign-in',
  imports: [HlmAlertImports, HlmSpinner, NgIcon, RouterLink, ShopButtonImports, TextField, TranslatePipe],
  providers: [provideIcons({ lucideCheck, lucideCircleAlert })],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);

  /** True when the account page has just deleted the account and sent the person here. */
  protected readonly accountDeleted =
    inject(Router).currentNavigation()?.extras.state?.['accountDeleted'] === true;
  protected readonly signingIn = signal(false);
  protected readonly creating = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly accountMessage = signal('');
  protected readonly model = signal({ email: '', password: '' });
  protected readonly accountModel = signal({ name: '', email: '', password: '' });
  protected readonly signInForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    emailAddress(path.email);
    required(path.password, { message: 'Enter your password.' });
    minLength(path.password, 8, { message: 'Passwords have at least 8 characters.' });
  });
  protected readonly accountForm = form(this.accountModel, (path) => {
    personName(path.name);
    required(path.email, { message: 'Enter your email.' });
    emailAddress(path.email);
    required(path.password, { message: 'Choose a password of at least 8 characters.' });
    minLength(path.password, 8, { message: 'Choose a password of at least 8 characters.' });
  });

  protected signIn(): void {
    this.errorMessage.set('');
    void submit(this.signInForm, async () => {
      this.signingIn.set(true);
      try {
        const { email: address, password } = this.model();
        await this.enter(await this.shop.signInWithNeon(address, password));
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

  private async enter(actor: { role: ShopRole }): Promise<void> {
    await this.router.navigateByUrl(LANDING[actor.role]);
  }
}
