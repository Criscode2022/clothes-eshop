import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut, lucideMenu, lucideShoppingBag } from '@ng-icons/lucide';
import { canOpenArea } from '../../shop/access';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { CATEGORIES } from '../../shop/catalog';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { SiteMenu } from '../site-menu/site-menu';
import { nextHeaderScroll } from './header-tuck';

@Component({
  selector: 'app-site-header',
  imports: [NgIcon, RouterLink, RouterLinkActive, SiteMenu],
  providers: [provideIcons({ lucideLogOut, lucideMenu, lucideShoppingBag })],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  host: { '[class.is-tucked]': 'tucked()' },
})
export class SiteHeader {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly signInLink = viewChild<ElementRef<HTMLElement>>('signInLink');

  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly session = inject(ShopSession);
  protected readonly categories = CATEGORIES;
  protected readonly menuOpen = signal(false);
  protected readonly tucked = signal(false);
  /** Clients keep their own orders; staff reach the whole book through the desk or the backoffice. */
  protected readonly showOrders = computed(() => this.session.current()?.role === 'client');
  protected readonly showDesk = computed(() => canOpenArea('desk', this.session.current()));
  protected readonly showOwner = computed(() => canOpenArea('owner', this.session.current()));

  constructor() {
    this.tuckWhileReading();
  }

  protected async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.shop.signOut();
    await this.router.navigateByUrl('/');
    this.keepFocusAfterSignOut();
  }

  /**
   * Leaving another page moves focus to the new content. Signing out on the floor itself goes
   * nowhere, so focus moves to Sign in, which now stands where the sign-out button was.
   */
  private keepFocusAfterSignOut(): void {
    afterNextRender(
      () => {
        if (this.document.activeElement === this.document.body) {
          this.signInLink()?.nativeElement.focus();
        }
      },
      { injector: this.injector },
    );
  }

  /** The header steps aside while the shopper reads down a page and comes back when they scroll up. */
  private tuckWhileReading(): void {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let scroll = { baselineY: window.scrollY, tucked: false };
      let frame = 0;
      const onScroll = (): void => {
        if (frame) {
          return;
        }
        frame = requestAnimationFrame(() => {
          frame = 0;
          scroll = nextHeaderScroll(scroll, window.scrollY);
          this.tucked.set(scroll.tucked && !this.menuOpen() && !this.drawer.isOpen());
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(frame);
      });
    });
  }
}
