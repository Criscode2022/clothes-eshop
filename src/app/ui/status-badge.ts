import { Component, input } from '@angular/core';
import { TranslatePipe } from '../i18n/translate.pipe';
import { HlmBadge } from '@spartan-ng/helm/badge';

/** What a status dot says at a glance: muted, current, under way, done, or stopped. */
export type StatusTone = 'quiet' | 'current' | 'under-way' | 'done' | 'stopped';

/** A status as a colored dot and its name. The name always carries the meaning; the dot only helps scanning. */
@Component({
  selector: 'app-status-badge',
  imports: [HlmBadge, TranslatePipe],
  host: { '[attr.data-tone]': 'tone()' },
  template: `<span hlmBadge variant="outline" class="status"
    ><span class="status__dot" aria-hidden="true"></span>{{ label() | t }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
    }

    .status {
      gap: 0.5rem;
      height: 1.75rem;
      padding-inline: 0.625rem;
      font-size: var(--text-sm);
      font-weight: 400;
      font-stretch: 100%;
    }

    .status__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--color-text-muted);
    }

    :host([data-tone='current']) .status__dot {
      background: var(--color-text);
    }

    :host([data-tone='under-way']) .status__dot {
      background: var(--color-notice);
    }

    :host([data-tone='done']) .status__dot {
      background: var(--color-positive);
    }

    :host([data-tone='stopped']) .status__dot {
      background: var(--color-danger);
    }
  `,
})
export class StatusBadge {
  readonly tone = input.required<StatusTone>();
  readonly label = input.required<string>();
}
