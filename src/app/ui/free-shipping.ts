import { Component, computed, input } from '@angular/core';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { centsUntilFreeShipping, freeShippingProgress } from '../shop/money';
import { TranslatePipe } from '../i18n/translate.pipe';
import { MoneyPipe } from '../shop/money.pipe';

/** How close the pieces are to free shipping, in words and as a filling line. */
@Component({
  selector: 'app-free-shipping',
  imports: [HlmProgressImports, MoneyPipe, TranslatePipe],
  template: `
    <p class="note">
      @if (remaining() > 0) {
        {{ 'Add {amount} more for free shipping.' | t: { amount: (remaining() | money) } }}
      } @else {
        {{ 'Shipping is free on this order.' | t }}
      }
    </p>
    <hlm-progress class="meter" [value]="percent()" [attr.aria-label]="'Toward free shipping' | t">
      <hlm-progress-indicator class="meter__fill" />
    </hlm-progress>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }

    .note {
      font-size: var(--text-sm);
    }

    .meter {
      height: 2px;
      background: var(--color-border);
    }

    .meter__fill {
      background: var(--color-text);
      transition: transform var(--duration-slow) var(--ease-out);
    }
  `,
})
export class FreeShipping {
  readonly subtotalCents = input.required<number>();

  protected readonly remaining = computed(() => centsUntilFreeShipping(this.subtotalCents()));
  protected readonly percent = computed(() =>
    Math.round(freeShippingProgress(this.subtotalCents()) * 100),
  );
}
