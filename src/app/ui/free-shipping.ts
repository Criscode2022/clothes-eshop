import { Component, computed, input } from '@angular/core';
import { centsUntilFreeShipping, freeShippingProgress } from '../shop/money';
import { MoneyPipe } from '../shop/money.pipe';

/** How close the pieces are to free shipping, in words and as a filling line. */
@Component({
  selector: 'app-free-shipping',
  imports: [MoneyPipe],
  template: `
    <p class="text-sm">
      @if (remaining() > 0) {
        Add {{ remaining() | money }} more for free shipping.
      } @else {
        Shipping is free on this order.
      }
    </p>
    <div class="meter" aria-hidden="true">
      <span class="meter__fill" [style.transform]="'scaleX(' + progress() + ')'"></span>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }

    .meter {
      height: 2px;
      background: var(--color-border);
      overflow: hidden;
    }

    .meter__fill {
      display: block;
      height: 100%;
      background: var(--color-text);
      transform-origin: left;
      transition: transform var(--duration-base) var(--ease-out);
    }
  `,
})
export class FreeShipping {
  readonly subtotalCents = input.required<number>();

  protected readonly remaining = computed(() => centsUntilFreeShipping(this.subtotalCents()));
  protected readonly progress = computed(() => freeShippingProgress(this.subtotalCents()));
}
