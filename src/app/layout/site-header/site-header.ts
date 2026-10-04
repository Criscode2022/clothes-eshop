import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { canOpenArea } from '../../shop/access';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { CATEGORIES } from '../../shop/catalog';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { closeModal, isBackdropClick, openModal } from '../../ui/dialog';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'app-site-header',
  imports: [Icon, RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);
  private readonly menu = viewChild.required<ElementRef<HTMLDialogElement>>('menu');

  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly session = inject(ShopSession);
  protected readonly categories = CATEGORIES;
  protected readonly menuOpen = signal(false);
  protected readonly isClient = computed(() => this.session.current()?.role === 'client');
  protected readonly showDesk = computed(() => canOpenArea('desk', this.session.current()));
  protected readonly showOwner = computed(() => canOpenArea('owner', this.session.current()));

  protected openMenu(): void {
    openModal(this.menu().nativeElement);
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    closeModal(this.menu().nativeElement);
  }

  protected menuClosed(): void {
    this.menuOpen.set(false);
  }

  protected closeMenuFromBackdrop(event: MouseEvent): void {
    if (isBackdropClick(event, this.menu().nativeElement)) {
      this.closeMenu();
    }
  }

  protected async signOut(): Promise<void> {
    this.closeMenu();
    await this.shop.signOut();
    await this.router.navigateByUrl('/');
  }
}
