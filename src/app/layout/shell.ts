import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { canOpenArea } from '../shop/access';
import { Bag } from '../shop/bag';
import { ShopClient } from '../shop/shop-client';
import { ShopSession } from '../shop/shop-session';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly shop = inject(ShopClient);
  protected readonly bag = inject(Bag);
  protected readonly session = inject(ShopSession);
  protected readonly showDesk = computed(() => canOpenArea('desk', this.session.current()));
  protected readonly showOwner = computed(() => canOpenArea('owner', this.session.current()));

  constructor() {
    const router = inject(Router);
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

  protected signOut(): void {
    void this.shop.signOut();
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.focusMain();
  }

  private focusMain(): void {
    this.main().nativeElement.focus();
  }
}
