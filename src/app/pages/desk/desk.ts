import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StaffHeader } from '../staff/staff-header';
import type { StaffSection } from '../staff/staff-header';

/** The workers' area: orders to move through the workroom, and stock to correct. */
@Component({
  selector: 'app-desk',
  imports: [RouterOutlet, StaffHeader],
  template: `
    <app-staff-header
      title="Daily desk"
      lede="Move orders through the workroom and correct on-hand stock. Prices stay with the owner."
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
export class Desk {
  protected readonly sections: readonly StaffSection[] = [
    { label: 'Orders', path: '/desk', exact: true },
    { label: 'Stock', path: '/desk/stock', exact: false },
  ];
}
