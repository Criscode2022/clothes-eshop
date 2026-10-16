import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideCircleAlert, lucideReceipt } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/** Neon Auth accepts passwords of 8 to 128 characters. */
const PASSWORD = { min: 8, max: 128 } as const;

/** Your account: the name the shop uses, the password, your orders, signing out, and deleting the account. */
@Component({
  selector: 'app-account',
  imports: [
    HlmAlertDialogImports,
    HlmAlertImports,
    HlmItemImports,
    HlmSpinner,
    NgIcon,
    RouterLink,
    ShopButtonImports,
    TextField,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideCircleAlert, lucideReceipt })],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountPage {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);
  protected readonly session = inject(ShopSession);

  protected readonly person = this.session.current;
  /** Only a client lists orders here and deletes their own account; the owner closes staff accounts. */
  protected readonly isClient = computed(() => this.person()?.role === 'client');

  protected readonly nameModel = linkedSignal(() => ({ name: this.person()?.name ?? '' }));
  protected readonly nameForm = form(this.nameModel, (path) => {
    required(path.name, { message: 'Enter your name, at least 2 letters.' });
    minLength(path.name, 2, { message: 'Enter your name, at least 2 letters.' });
    maxLength(path.name, 80, { message: 'Keep the name under 80 letters.' });
  });
  protected readonly savingName = signal(false);
  protected readonly nameStatus = signal('');
  protected readonly nameError = signal('');

  protected readonly passwordModel = signal({ current: '', next: '', confirm: '' });
  protected readonly passwordForm = form(this.passwordModel, (path) => {
    required(path.current, { message: 'Enter your current password.' });
    required(path.next, { message: `Choose a password of at least ${PASSWORD.min} characters.` });
    minLength(path.next, PASSWORD.min, {
      message: `Choose a password of at least ${PASSWORD.min} characters.`,
    });
    maxLength(path.next, PASSWORD.max, {
      message: `Keep the password under ${PASSWORD.max} characters.`,
    });
    validate(path.confirm, ({ value, valueOf }) =>
      value() === valueOf(path.next)
        ? null
        : { kind: 'mismatch', message: 'Type the same new password twice.' },
    );
  });
  protected readonly savingPassword = signal(false);
  protected readonly passwordStatus = signal('');
  protected readonly passwordError = signal('');

  protected readonly deleteModel = signal({ password: '' });
  protected readonly deleteForm = form(this.deleteModel, (path) => {
    required(path.password, { message: 'Enter your password to delete the account.' });
  });
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal('');

  protected saveName(): void {
    this.nameStatus.set('');
    this.nameError.set('');
    void submit(this.nameForm, async () => {
      this.savingName.set(true);
      try {
        await this.shop.renameAccount(this.nameModel().name);
        this.nameStatus.set('Saved. The shop uses this name from now on.');
      } catch (error) {
        this.nameError.set(messageOf(error, 'The name could not be saved.'));
      } finally {
        this.savingName.set(false);
      }
    });
  }

  protected changePassword(): void {
    this.passwordStatus.set('');
    this.passwordError.set('');
    void submit(this.passwordForm, async () => {
      this.savingPassword.set(true);
      const { current, next } = this.passwordModel();
      try {
        await this.shop.changePassword(current, next);
        this.passwordModel.set({ current: '', next: '', confirm: '' });
        this.passwordForm().reset();
        this.passwordStatus.set('Password changed. Other devices are signed out.');
      } catch (error) {
        this.passwordError.set(messageOf(error, 'The password could not be changed.'));
      } finally {
        this.savingPassword.set(false);
      }
    });
  }

  protected deleteAccount(): void {
    this.deleteError.set('');
    void submit(this.deleteForm, async () => {
      this.deleting.set(true);
      try {
        await this.shop.deleteAccount(this.deleteModel().password);
        await this.router.navigateByUrl('/sign-in', { state: { accountDeleted: true } });
      } catch (error) {
        this.deleteError.set(messageOf(error, 'The account could not be deleted.'));
      } finally {
        this.deleting.set(false);
      }
    });
  }

  /** Closing the dialog forgets the password typed into it. */
  protected forgetDeletePassword(): void {
    this.deleteModel.set({ password: '' });
    this.deleteForm().reset();
    this.deleteError.set('');
  }

  protected async signOut(): Promise<void> {
    await this.shop.signOut();
    await this.router.navigateByUrl('/');
  }
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
