import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StaffHeader } from '../staff/staff-header';
import type { StaffSection } from '../staff/staff-header';

/** The owner's area: every order, the catalog's prices and sizes, and new pieces. */
@Component({
  selector: 'app-owner',
  imports: [RouterOutlet, StaffHeader],
  template: `
    <app-staff-header
      title="Backoffice"
      lede="Prices, sizes and colors, new pieces, and every order. Workers cannot open this area."
      [sections]="sections"
    />
    <div class="page staff-body"><router-outlet /></div>
  `,
  styles: `
    .staff-body {
      padding-block: 2rem 0;
    }
  `,
})
export class Owner {
  protected readonly sections: readonly StaffSection[] = [
    { label: 'Orders', path: '/owner', exact: true },
    { label: 'Pieces', path: '/owner/pieces', exact: false },
    { label: 'New piece', path: '/owner/new', exact: false },
  ];
}
