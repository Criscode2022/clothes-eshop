import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface StaffSection {
  readonly label: string;
  readonly path: string;
  /** Matches only this exact URL, for a section that is the area's front page. */
  readonly exact: boolean;
}

/** The title of a staff area and the sections inside it, as tabs that are real links. */
@Component({
  selector: 'app-staff-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="head page">
      <div class="head__text">
        <h1 class="head__title">{{ title() }}</h1>
        <p class="head__lede">{{ lede() }}</p>
      </div>
      <nav class="sections" [attr.aria-label]="title() + ' sections'">
        <ul role="list">
          @for (section of sections(); track section.path) {
            <li>
              <a
                [routerLink]="section.path"
                routerLinkActive="is-current"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: section.exact }"
                >{{ section.label }}</a
              >
            </li>
          }
        </ul>
      </nav>
    </header>
  `,
  styles: `
    .head {
      display: grid;
      gap: 1.75rem;
      padding-top: 2.5rem;
    }

    .head__text {
      display: grid;
      gap: 0.5rem;
    }

    .head__title {
      font-size: var(--text-xl);
    }

    .head__lede {
      max-width: var(--measure);
      font-size: var(--text-ui);
      color: var(--color-text-muted);
    }

    .sections {
      overflow-x: auto;
      border-bottom: 1px solid var(--color-border);

      ul {
        display: flex;
        gap: 2rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      a {
        position: relative;
        display: inline-flex;
        align-items: center;
        min-height: 2.75rem;
        font-size: var(--text-ui);
        white-space: nowrap;
        text-decoration: none;
        color: var(--color-text-muted);
        transition: color var(--duration-fast) ease-out;

        &::after {
          content: '';
          position: absolute;
          inset-inline: 0;
          bottom: -1px;
          height: 2px;
          background: currentColor;
          transform: scaleX(0);
          transition: transform var(--duration-base) var(--ease-out);
        }

        &:hover {
          color: var(--color-text);
        }

        &:hover::after {
          transform: scaleX(0.35);
        }

        &.is-current {
          color: var(--color-text);

          &::after {
            transform: none;
          }
        }
      }
    }
  `,
})
export class StaffHeader {
  readonly title = input.required<string>();
  readonly lede = input.required<string>();
  readonly sections = input.required<readonly StaffSection[]>();
}
