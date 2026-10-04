import { Component, input } from '@angular/core';
import { MoneyPipe } from '../shop/money.pipe';

/** Subtotal, shipping, and total, in the same order everywhere an order is summed. */
@Component({
  selector: 'app-order-totals',
  imports: [MoneyPipe],
  template: `
    <dl class="totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{{ subtotalCents() | money }}</dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd>
          @if (shippingCents() === 0) {
            Free
          } @else {
            {{ shippingCents() | money }}
          }
        </dd>
      </div>
      <div class="totals__total">
        <dt>Total</dt>
        <dd>{{ totalCents() | money }}</dd>
      </div>
    </dl>
  `,
  styles: `
    .totals {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      font-size: var(--text-ui);
      font-variant-numeric: tabular-nums;

      div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      dt {
        color: var(--color-text-muted);
      }

      dd {
        margin: 0;
      }
    }

    .totals__total {
      padding-top: 0.75rem;
      margin-top: 0.25rem;
      font-size: var(--text-md);
      font-weight: 500;
      border-top: 1px solid var(--color-border);

      dt {
        color: var(--color-text);
      }
    }
  `,
})
export class OrderTotals {
  readonly subtotalCents = input.required<number>();
  readonly shippingCents = input.required<number>();
  readonly totalCents = input.required<number>();
}
