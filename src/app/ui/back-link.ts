import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { TranslatePipe } from '../i18n/translate.pipe';

/**
 * Back to where the shopper was. After a page change inside the shop it walks the browser history, so
 * the floor comes back with its filter and scroll; a page opened from outside (an email, a shared link)
 * has nothing of the shop's to go back to, so it goes to `fallback`. It is a link to `fallback`, so a
 * click with a modifier opens that page in a new tab.
 */
@Component({
  selector: 'app-back-link',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideArrowLeft })],
  template: `<a class="back" [attr.href]="fallback()" (click)="back($event)"
    ><ng-icon name="lucideArrowLeft" class="back__icon" aria-hidden="true" />{{ label() | t }}</a
  >`,
  styles: `
    :host {
      display: block;
    }

    .back {
      display: inline-flex;
      gap: 0.375rem;
      align-items: center;
      min-height: 2.75rem;
      font-size: var(--text-ui);
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
        text-underline-offset: 0.22em;

        .back__icon {
          translate: -0.25rem 0;
        }
      }
    }

    .back__icon {
      font-size: 1rem;
      transition: translate var(--duration-base) var(--ease-out);
    }
  `,
})
export class BackLink {
  /** Where Back goes when the shop has no page of its own to go back to. */
  readonly fallback = input.required<string>();
  readonly label = input('Back');

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected back(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigateByUrl(this.fallback());
    }
  }
}
