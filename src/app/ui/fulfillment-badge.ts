import { Component, computed, input } from '@angular/core';
import { fulfillmentName } from '../shop/fulfillment';
import type { Fulfillment } from '../shop/fulfillment';
import { StatusBadge } from './status-badge';
import type { StatusTone } from './status-badge';

const TONES: Record<Fulfillment, StatusTone> = {
  placed: 'current',
  preparing: 'under-way',
  shipped: 'under-way',
  ready: 'under-way',
  delivered: 'done',
  'picked-up': 'done',
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
