import { Component, computed, inject, input, signal } from '@angular/core';
import { form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideKeyRound, lucideLink2Off } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/**
 * Where the link in the password email lands. Neon Auth adds `?token=` when the link is good and
 * `?error=INVALID_TOKEN` when it has expired or was used.
 */
@Component({
  selector: 'app-reset-password',
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
  providers: [provideIcons({ lucideCircleAlert, lucideKeyRound, lucideLink2Off })],
  template: `
    <div class="password page">
      @if (done()) {
        <section hlmEmpty class="sent" aria-labelledby="done-title">
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon"><ng-icon name="lucideKeyRound" /></div>
            <h1 id="done-title" hlmEmptyTitle>{{ 'Your password is changed' | t }}</h1>
            <p hlmEmptyDescription>{{ 'Sign in with the new password.' | t }}</p>
          </div>
          <div hlmEmptyContent>
            <a hlmBtn routerLink="/sign-in">{{ 'Sign in' | t }}</a>
          </div>
        </section>
      } @else if (linkUsable()) {
        <header class="head">
          <h1 class="head__title">{{ 'Choose a new password' | t }}</h1>
          <p class="head__lede">
            {{ 'At least 8 characters. It replaces the old one straight away.' | t }}
          </p>
        </header>
        <form class="form" novalidate (submit)="save(); $event.preventDefault()">
          @if (errorMessage()) {
            <div hlmAlert variant="destructive" tabindex="-1">
              <ng-icon name="lucideCircleAlert" />
              <p hlmAlertDescription>
                {{ errorMessage() | t }}
                <a routerLink="/forgot-password">{{ 'Send a new link' | t }}</a>
              </p>
            </div>
          }
          <app-text-field
            inputId="reset-new"
            label="New password"
            type="password"
            autocomplete="new-password"
            [field]="resetForm.password"
          />
          <app-text-field
            inputId="reset-confirm"
            label="New password again"
            type="password"
            autocomplete="new-password"
            [field]="resetForm.confirm"
          />
          <button
            hlmBtn
            type="submit"
            class="w-full"
            [disabled]="saving()"
            [attr.aria-busy]="saving()"
          >
            @if (saving()) {
              <hlm-spinner aria-hidden="true" />
              {{ 'Saving the password' | t }}
            } @else {
              {{ 'Save the new password' | t }}
            }
          </button>
        </form>
      } @else {
        <section hlmEmpty class="sent" aria-labelledby="expired-title">
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon"><ng-icon name="lucideLink2Off" /></div>
            <h1 id="expired-title" hlmEmptyTitle>
              {{ 'That link has expired or was already used' | t }}
            </h1>
            <p hlmEmptyDescription>
              {{ 'A link works once, for 15 minutes. Ask for a new one.' | t }}
            </p>
          </div>
          <div hlmEmptyContent>
            <a hlmBtn routerLink="/forgot-password">{{ 'Send a new link' | t }}</a>
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './password.scss',
})
export class ResetPassword {
  /** Read from the link's query string. */
  readonly token = input<string>();
  readonly error = input<string>();

  private readonly shop = inject(ShopClient);

  protected readonly linkUsable = computed(() => Boolean(this.token()) && !this.error());
  protected readonly model = signal({ password: '', confirm: '' });
  protected readonly resetForm = form(this.model, (path) => {
    required(path.password, { message: 'Choose a password of at least 8 characters.' });
    minLength(path.password, 8, { message: 'Choose a password of at least 8 characters.' });
    maxLength(path.password, 128, { message: 'Keep the password under 128 characters.' });
    validate(path.confirm, ({ value, valueOf }) =>
      value() === valueOf(path.password)
        ? null
        : { kind: 'mismatch', message: 'Type the same new password twice.' },
    );
  });
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly done = signal(false);

  protected save(): void {
    this.errorMessage.set('');
    void submit(this.resetForm, async () => {
      this.saving.set(true);
      try {
        await this.shop.resetPassword(this.token() ?? '', this.model().password);
        this.done.set(true);
      } catch (error) {
        this.errorMessage.set(
          error instanceof Error && error.message
            ? error.message
            : 'That link has expired or was already used.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }
}
