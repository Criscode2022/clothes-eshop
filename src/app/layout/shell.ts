import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

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
      .subscribe(() => this.focusMain());
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.focusMain();
  }

  private focusMain(): void {
    this.main().nativeElement.focus();
  }
}
