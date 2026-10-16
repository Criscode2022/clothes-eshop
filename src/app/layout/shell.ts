import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { filter, skip } from 'rxjs';
import { Bag } from '../shop/bag';
import { BagDrawer } from '../shop/bag-drawer';
import { BagPersistence } from '../shop/bag-persistence';
import { ShopClient } from '../shop/shop-client';
import { ShopNotice } from '../shop/shop-notice';
import { TranslatePipe } from '../i18n/translate.pipe';
import { BagPanel } from './bag-panel/bag-panel';
import { PageLoading } from './page-loading';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header/site-header';

@Component({
  selector: 'app-shell',
  imports: [BagPanel, NgIcon, PageLoading, RouterOutlet, SiteFooter, SiteHeader, TranslatePipe],
  providers: [provideIcons({ lucideX })],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly notice = inject(ShopNotice);

  constructor() {
    const router = inject(Router);
    const persistence = inject(BagPersistence);
    const shop = inject(ShopClient);
    // The saved bag and the signed-in account live in the browser. Bringing them back after the
    // first render keeps hydration intact.
    afterNextRender(() => {
      const storage = browserStorage();
      if (storage) {
        persistence.start(storage);
      }
      void shop.resumeSession();
    });
    // Leave focus alone on the first page load. After each later navigation, move it to the
    // new content so keyboard and screen reader users start reading the page that just changed.
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(router.navigated ? 0 : 1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.bag.clearNotice();
        this.focusMain();
      });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.focusMain();
  }

  protected dismissNotice(): void {
    this.bag.clearNotice();
  }

  protected dismissShopNotice(): void {
    this.notice.dismiss();
  }

  private focusMain(): void {
    this.main().nativeElement.focus({ preventScroll: true });
  }
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Storage blocked by the browser: the bag still works, it just is not kept after a reload.
    return null;
  }
}
