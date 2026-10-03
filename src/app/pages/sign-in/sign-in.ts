import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { ShopClient } from '../../shop/shop-client';

@Component({
  selector: 'app-sign-in',
  imports: [FormField, RouterLink],
  templateUrl: './sign-in.html',
})
export class SignIn {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);
  protected readonly errorMessage = signal('');
  protected readonly accountMessage = signal('');
  protected readonly model = signal({ email: '', password: '' });
  protected readonly accountModel = signal({ name: '', email: '', password: '' });
  protected readonly signInForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter your email.' });
    required(path.password, { message: 'Enter the floor password.' });
    minLength(path.password, 8, { message: 'Enter the floor password.' });
  });
  protected readonly accountForm = form(this.accountModel, (path) => {
    required(path.name, { message: 'Enter your name.' });
    minLength(path.name, 2, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter your email.' });
    required(path.password, { message: 'Choose a password of at least 8 characters.' });
    minLength(path.password, 8, { message: 'Choose a password of at least 8 characters.' });
  });

  protected signIn(): void {
    submit(this.signInForm, async () => {
      this.errorMessage.set('');
      const { email: address, password } = this.model();
      try {
        await this.enter(await this.shop.signIn(address, password));
      } catch (floorError) {
        try {
          await this.enter(await this.shop.signInWithNeon(address, password));
        } catch (neonError) {
          const neonMessage = neonError instanceof Error ? neonError.message : '';
          const floorMessage = floorError instanceof Error ? floorError.message : 'Sign-in failed.';
          this.errorMessage.set(neonMessage || floorMessage);
        }
      }
    });
  }

  protected createAccount(): void {
    submit(this.accountForm, async () => {
      this.accountMessage.set('');
      const account = this.accountModel();
      try {
        await this.enter(await this.shop.signUpWithNeon(account.name, account.email, account.password));
      } catch (error) {
        this.accountMessage.set(error instanceof Error ? error.message : 'The account could not be created.');
      }
    });
  }

  private async enter(actor: { role: string }): Promise<void> {
    const destination = actor.role === 'owner' ? '/owner' : actor.role === 'worker' ? '/desk' : '/account/orders';
    await this.router.navigateByUrl(destination);
  }
}
