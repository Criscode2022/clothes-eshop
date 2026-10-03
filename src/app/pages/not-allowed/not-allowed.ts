import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-allowed',
  imports: [RouterLink],
  template: `
    <h1 class="font-display text-display">This part of the shop is closed to you</h1>
    <p class="mt-4 max-w-[62ch]">
      The desk and the backoffice are for the people who run the shop. A client account stays on the floor.
    </p>
    <p class="mt-6">
      <a routerLink="/">Return to the shop</a>
    </p>
  `,
})
export class NotAllowed {}
