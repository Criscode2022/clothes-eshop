import { Component, computed, input } from '@angular/core';
import { fulfillmentName } from '../shop/checkout';
import type { Fulfillment } from '../shop/checkout';
import { StatusBadge } from './status-badge';
import type { StatusTone } from './status-badge';

const TONES: Record<Fulfillment, StatusTone> = {
  placed: 'current',
  picking: 'under-way',
  ready: 'under-way',
  completed: 'done',
  cancelled: 'stopped',
};

/** An order's state as a status badge. */
@Component({
  selector: 'app-fulfillment-badge',
  imports: [StatusBadge],
  host: { '[attr.data-state]': 'state()' },
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `<app-status-badge [tone]="tone()" [label]="name()" />`,
})
export class FulfillmentBadge {
  readonly state = input.required<Fulfillment>();

  protected readonly tone = computed(() => TONES[this.state()]);
  protected readonly name = computed(() => fulfillmentName(this.state()));
}
