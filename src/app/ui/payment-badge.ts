import { Component, computed, input } from '@angular/core';
import type { PaymentState } from '../shop/bank-transfer';
import { StatusBadge } from './status-badge';

/** Where a bank transfer stands: pending until it arrives, then paid. */
@Component({
  selector: 'app-payment-badge',
  imports: [StatusBadge],
  host: { '[attr.data-state]': 'state()' },
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `<app-status-badge [tone]="tone()" [label]="label()" />`,
})
export class PaymentBadge {
  readonly state = input.required<PaymentState>();

  protected readonly tone = computed(() => (this.state() === 'paid' ? 'done' : 'under-way'));
  protected readonly label = computed(() => (this.state() === 'paid' ? 'Paid' : 'Payment pending'));
}
