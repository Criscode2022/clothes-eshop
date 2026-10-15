import { Component, input } from '@angular/core';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';

/** One step of the trail. The last step is the page itself: it has no link and is marked current. */
export interface Crumb {
  readonly label: string;
  readonly link?: string;
}

/** Where this page sits in the shop, as Spartan's breadcrumb: "Shop › Shirts › Oxford Cloth Shirt". */
@Component({
  selector: 'app-breadcrumb',
  imports: [HlmBreadcrumbImports],
  template: `
    <nav hlmBreadcrumb aria-label="Breadcrumb">
      <ol hlmBreadcrumbList>
        @for (crumb of trail(); track $index; let last = $last) {
          <li hlmBreadcrumbItem>
            @if (last || !crumb.link) {
              <span hlmBreadcrumbPage>{{ crumb.label }}</span>
            } @else {
              <a hlmBreadcrumbLink [link]="crumb.link">{{ crumb.label }}</a>
            }
          </li>
          @if (!last) {
            <li hlmBreadcrumbSeparator></li>
          }
        }
      </ol>
    </nav>
  `,
})
export class Breadcrumb {
  readonly trail = input.required<readonly Crumb[]>();
}
