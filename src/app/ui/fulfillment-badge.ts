import { Component, computed, input } from '@angular/core';
import { fulfillmentName } from '../shop/checkout';
import type { Fulfillment } from '../shop/checkout';

/** An order's state as a colored dot and its name. The name always carries the meaning; the dot only helps scanning. */
@Component({
  selector: 'app-fulfillment-badge',
  template: `<span [class]="'status-badge status-badge--' + state()">{{ name() }}</span>`,
})
export class FulfillmentBadge {
  readonly state = input.required<Fulfillment>();

  protected readonly name = computed(() => fulfillmentName(this.state()));
}
