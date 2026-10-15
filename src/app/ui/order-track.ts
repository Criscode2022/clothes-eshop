import { Component, computed, input } from '@angular/core';
import { fulfillmentNote, fulfillmentTrack } from '../shop/fulfillment';
import type { NotedOrder } from '../shop/fulfillment';

/**
 * Where an order is: the steps of its own track (to the door, or to the shop's counter), and a
 * sentence saying what the current one means.
 */
@Component({
  selector: 'app-order-track',
  template: `
    @if (steps().length > 0) {
      <ol class="track" aria-label="Order progress">
        @for (step of steps(); track step.state; let index = $index) {
          <li
            [style.--i]="index"
            class="track__step"
            [class.track__step--done]="step.status === 'done'"
            [class.track__step--current]="step.status === 'current'"
            [attr.aria-current]="step.status === 'current' ? 'step' : null"
          >
            <span class="track__mark" aria-hidden="true"></span>
            <span class="track__label">{{ step.label }}</span>
            @if (step.status === 'done') {
              <span class="sr-only">, done</span>
            }
          </li>
        }
      </ol>
    }
    <p class="track-note">{{ note() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.25rem;
    }

    .track {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-sm);
    }

    .track__step {
      display: grid;
      gap: 0.625rem;
      color: var(--color-text-muted);
    }

    .track__mark {
      position: relative;
      height: 2px;
      overflow: hidden;
      background: var(--color-border);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--color-text);
        transform: scaleX(0);
        transform-origin: left;
      }
    }

    .track__step--done,
    .track__step--current {
      color: var(--color-text);

      .track__mark::after {
        transform: none;
        animation: fill-x var(--duration-slow) var(--ease-out) both;
        animation-delay: calc(var(--i, 0) * 220ms + 200ms);
      }
    }

    .track__label {
      padding-inline-end: 0.5rem;
    }

    .track__step--current .track__label {
      font-weight: 600;
    }

    .track-note {
      max-width: var(--measure);
      font-size: var(--text-ui);
    }
  `,
})
export class OrderTrack {
  readonly order = input.required<NotedOrder>();

  protected readonly steps = computed(() => fulfillmentTrack(this.order()));
  protected readonly note = computed(() => fulfillmentNote(this.order()));
}
