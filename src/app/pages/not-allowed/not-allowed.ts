import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock } from '@ng-icons/lucide';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ShopSession } from '../../shop/shop-session';
import { ShopButtonImports } from '../../ui/shop-button';

@Component({
  selector: 'app-not-allowed',
  imports: [HlmEmptyImports, NgIcon, RouterLink, ShopButtonImports, TranslatePipe],
  providers: [provideIcons({ lucideLock })],
  template: `
    <section hlmEmpty class="closed page" aria-labelledby="closed-title">
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon"><ng-icon name="lucideLock" /></div>
        <h1 id="closed-title" hlmEmptyTitle>{{ 'This part of the shop is closed to you' | t }}</h1>
        <p hlmEmptyDescription>
          {{
            'The desk and the backoffice are for the people who run the shop. A client account stays on the floor.'
              | t
          }}
        </p>
      </div>
      <div hlmEmptyContent class="closed__actions">
        <a hlmBtn routerLink="/">{{ 'Return to the shop' | t }}</a>
        @if (!session.current()) {
          <a hlmBtn variant="outline" routerLink="/sign-in">{{ 'Sign in as staff' | t }}</a>
        }
      </div>
    </section>
  `,
  styles: `
    .closed {
      padding-block: 5rem 0;
    }

    .closed__actions {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }
  `,
})
export class NotAllowed {
  protected readonly session = inject(ShopSession);
}
