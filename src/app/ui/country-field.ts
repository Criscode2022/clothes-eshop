import { Component, input, output } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnComboboxImports } from '@spartan-ng/brain/combobox';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { COUNTRIES, CONTINENTS, matchesCountry } from '../shop/countries';
import { fieldMessages } from './field-messages';

/**
 * The delivery country: type a few letters, in English or the country's own language, and pick it from
 * the list, grouped by continent. Spartan's combobox brings the behavior and the list; the input is
 * Marlow's own, so it looks like every other field and names its hint and error.
 */
@Component({
  selector: 'app-country-field',
  imports: [BrnComboboxImports, FormField, HlmComboboxImports, NgIcon],
  providers: [provideIcons({ lucideChevronDown })],
  host: { class: 'field' },
  template: `
    <label class="field__label" [for]="inputId()">{{ label() }}</label>
    <hlm-combobox
      [formField]="field()"
      [filter]="filter"
      autoHighlight
      (valueChange)="chosen.emit()"
    >
      <div class="country" brnComboboxAnchor>
        <input
          class="input country__input"
          brnComboboxInput
          brnComboboxPopoverTrigger
          [closeOnTriggerClick]="false"
          [id]="inputId()"
          [aria-invalid]="errorShown()"
          [attr.aria-describedby]="describedBy()"
          placeholder="Type to search"
        />
        <button
          type="button"
          class="country__toggle"
          brnComboboxPopoverTrigger
          tabindex="-1"
          aria-label="Show every country"
        >
          <ng-icon name="lucideChevronDown" />
        </button>
      </div>
      <!-- The list opens in a layer at the end of the page; as a named region it is not loose content. -->
      <hlm-combobox-content *hlmComboboxPortal role="region" aria-label="Countries">
        <hlm-combobox-empty
          >No country by that name. Marlow ships to the ones listed.</hlm-combobox-empty
        >
        <div hlmComboboxList>
          @for (group of groups; track group.continent) {
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>{{ group.continent }}</div>
              @for (country of group.countries; track country.code) {
                <hlm-combobox-item [value]="country.name">{{ country.name }}</hlm-combobox-item>
              }
            </div>
          }
        </div>
      </hlm-combobox-content>
    </hlm-combobox>
    @if (hint()) {
      <p class="field__hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
    @if (errorShown()) {
      <p class="field__error" [id]="inputId() + '-error'">{{ error() }}</p>
    }
  `,
  styles: `
    .country {
      position: relative;
    }

    .country__input {
      padding-inline-end: 2.75rem;
    }

    .country__toggle {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      display: grid;
      place-items: center;
      width: 2.75rem;
      color: var(--color-text-muted);
      transition: color var(--duration-fast) ease-out;

      &:hover {
        color: var(--color-text);
      }
    }
  `,
})
export class CountryField {
  readonly field = input.required<Field<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input('');
  /** A different country was picked: the fields that depend on it change. */
  readonly chosen = output();

  protected readonly groups = CONTINENTS.map((continent) => ({
    continent,
    countries: COUNTRIES.filter((country) => country.continent === continent),
  }));
  protected readonly filter = (name: string, search: string): boolean =>
    matchesCountry(name, search);

  private readonly messages = fieldMessages(this.field, this.inputId, this.hint);
  protected readonly errorShown = this.messages.errorShown;
  protected readonly error = this.messages.error;
  protected readonly describedBy = this.messages.describedBy;
}
