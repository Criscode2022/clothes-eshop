import { Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideMailCheck } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/**
 * Asks Neon Auth to email a link for choosing a new password. The page answers the same way whether or
 * not an account uses the address, so it never tells a stranger who shops here.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [
    HlmAlertImports,
    HlmEmptyImports,
    HlmSpinner,
    NgIcon,
    RouterLink,
    ShopButtonImports,
    TextField,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideCircleAlert, lucideMailCheck })],
  template: `
    <div class="password page">
      @if (sentTo(); as address) {
        <section hlmEmpty class="sent" aria-labelledby="sent-title">
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon"><ng-icon name="lucideMailCheck" /></div>
            <h1 id="sent-title" hlmEmptyTitle tabindex="-1">{{ 'Check your inbox' | t }}</h1>
            <p hlmEmptyDescription>
              {{
                'If a Marlow account uses {email}, a link to choose a new password is on its way. It works for 15 minutes.'
                  | t: { email: address }
              }}
            </p>
          </div>
          <div hlmEmptyContent class="sent__actions">
            <a hlmBtn routerLink="/sign-in">{{ 'Back to sign in' | t }}</a>
            <button hlmBtn variant="link" size="sm" type="button" (click)="sendAgain()">
              {{ 'Nothing arrived? Send it again' | t }}
            </button>
          </div>
        </section>
      } @else {
        <header class="head">
          <h1 class="head__title">{{ 'Forgot your password?' | t }}</h1>
          <p class="head__lede">
            {{
              'Enter the email of your Marlow account and the shop sends a link to choose a new password.'
                | t
            }}
          </p>
        </header>
        <form class="form" novalidate (submit)="send(); $event.preventDefault()">
          @if (errorMessage()) {
            <div hlmAlert variant="destructive" tabindex="-1">
              <ng-icon name="lucideCircleAlert" />
              <p hlmAlertDescription>{{ errorMessage() | t }}</p>
            </div>
          }
          <app-text-field
            inputId="reset-email"
            label="Email"
            type="email"
            autocomplete="email"
            [field]="resetForm.email"
          />
          <button
            hlmBtn
            type="submit"
            class="w-full"
            [disabled]="sending()"
            [attr.aria-busy]="sending()"
          >
            @if (sending()) {
              <hlm-spinner aria-hidden="true" />
              {{ 'Sending the link' | t }}
            } @else {
              {{ 'Send the link' | t }}
            }
          </button>
          <p class="note"><a routerLink="/sign-in">{{ 'Back to sign in' | t }}</a></p>
        </form>
      }
    </div>
  `,
  styleUrl: './password.scss',
})
export class ForgotPassword {
  private readonly shop = inject(ShopClient);

  protected readonly model = signal({ email: '' });
  protected readonly resetForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter an email address, like name@example.com.' });
  });
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly sentTo = signal('');

  protected send(): void {
    this.errorMessage.set('');
    void submit(this.resetForm, async () => {
      this.sending.set(true);
      const address = this.model().email.trim();
      try {
        await this.shop.requestPasswordReset(address);
        this.sentTo.set(address);
      } catch {
        // What failed is the sending, never whether the account exists: the address stays typed for a retry.
        this.errorMessage.set('The link could not be sent just now. Try again in a moment.');
      } finally {
        this.sending.set(false);
      }
    });
  }

  protected sendAgain(): void {
    this.sentTo.set('');
  }
}
