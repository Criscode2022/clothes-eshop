import { Component, input } from '@angular/core';

export type IconName =
  'bag' | 'close' | 'plus' | 'minus' | 'menu' | 'check' | 'chevron-down' | 'copy';

/** The shop's line icons: one 1.5px stroke on a 24px grid, drawn in the text color, hidden from assistive tech. */
@Component({
  selector: 'app-icon',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('bag') {
          <path d="M5.5 8.5h13l-1 11.5h-11z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
        }
        @case ('close') {
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        }
        @case ('plus') {
          <path d="M12 5.5v13M5.5 12h13" />
        }
        @case ('minus') {
          <path d="M5.5 12h13" />
        }
        @case ('menu') {
          <path d="M4 9h16M4 15h16" />
        }
        @case ('check') {
          <path d="M5.5 12.5l4 4 9-9.5" />
        }
        @case ('chevron-down') {
          <path d="M7 10l5 5 5-5" />
        }
        @case ('copy') {
          <rect x="8.5" y="8.5" width="11" height="11" />
          <path d="M15.5 5.5v-1h-11v11h1" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
