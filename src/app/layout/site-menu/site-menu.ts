import { Component, computed, inject, model, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { filter } from 'rxjs';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { canOpenArea } from '../../shop/access';
import { CATEGORIES, productsIn } from '../../shop/catalog';
import { CatalogStore } from '../../shop/catalog-store';
import { ShopSession } from '../../shop/shop-session';
import { ShopButtonImports } from '../../ui/shop-button';

/** The phone menu: the floor's rooms first, then the shopper's own doors, sliding in from the left edge. */
@Component({
  selector: 'app-site-menu',
  imports: [HlmSheetImports, NgIcon, RouterLink, ShopButtonImports, TranslatePipe],
  providers: [provideIcons({ lucideX })],
  templateUrl: './site-menu.html',
  styleUrl: './site-menu.scss',
})
export class SiteMenu {
  readonly open = model(false);
  readonly signOut = output();

  private readonly catalog = inject(CatalogStore);
  protected readonly session = inject(ShopSession);
  protected readonly categories = CATEGORIES;
  protected readonly isClient = computed(() => this.session.current()?.role === 'client');
  protected readonly showDesk = computed(() => canOpenArea('desk', this.session.current()));
  protected readonly showOwner = computed(() => canOpenArea('owner', this.session.current()));

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }

  protected countIn(slug: string): number {
    return productsIn(this.catalog.pieces(), slug).length;
  }

  protected stateChanged(state: BrnDialogState): void {
    this.open.set(state === 'open');
  }
}
