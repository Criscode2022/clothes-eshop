import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnComboboxImports } from '@spartan-ng/brain/combobox';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { Language } from '../i18n/language';
import { TranslatePipe } from '../i18n/translate.pipe';
import { translate } from '../i18n/translate';
import { COUNTRIES, CONTINENTS, matchesCountry } from '../shop/countries';
import { fieldMessages } from './field-messages';

/** How long the list waits after a letter before it narrows. Matches the shop's fast duration. */
const SEARCH_WAIT_MS = 160;

/**
 * The delivery country: type a few letters, in English or the country's own language, and pick it from
 * the list, grouped by continent. Spartan's combobox brings the behavior and the list; the input is
 * Marlow's own, so it looks like every other field and names its hint and error.
 */
@Component({
  selector: 'app-country-field',
  imports: [BrnComboboxImports, FormField, HlmComboboxImports, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideChevronDown })],
  host: { class: 'field' },
  template: `
    <label class="field__label" [for]="inputId()">{{ label() | t }}</label>
    <hlm-combobox
      [formField]="field()"
      [filter]="filter"
      [itemToString]="itemToString()"
      autoHighlight
      (searchChange)="onSearch($event)"
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
          #countryInput
          [attr.placeholder]="'Type to search' | t"
        />
        <button
          type="button"
          class="country__toggle"
          brnComboboxPopoverTrigger
          tabindex="-1"
          [attr.aria-label]="'Show every country' | t"
        >
          <ng-icon name="lucideChevronDown" />
        </button>
      </div>
      <!-- The list opens in a layer at the end of the page; as a named region it is not loose content. -->
      <hlm-combobox-content *hlmComboboxPortal role="region" [attr.aria-label]="'Countries' | t">
        <hlm-combobox-empty>{{
          'No country by that name. Marlow ships to the ones listed.' | t
        }}</hlm-combobox-empty>
        <div hlmComboboxList>
          @for (group of groups; track group.continent) {
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>{{ group.continent | t }}</div>
              @for (country of group.countries; track country.code) {
                <hlm-combobox-item [value]="country.name">{{ country.name | t }}</hlm-combobox-item>
              }
            </div>
          }
        </div>
      </hlm-combobox-content>
    </hlm-combobox>
    @if (hint()) {
      <p class="field__hint" [id]="inputId() + '-hint'">{{ hint() | t }}</p>
    }
    @if (errorShown()) {
      <p class="field__error" [id]="inputId() + '-error'">{{ error() | t }}</p>
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

  private readonly language = inject(Language);

  protected readonly itemToString = computed(() => {
    const locale = this.language.locale();
    return (name: string): string => translate(locale, name);
  });

  /**
   * The letters the list is using. The field shows each letter at once; this follows a moment
   * later, so a quick run of letters narrows the list once. An empty field shows every country
   * immediately.
   */
  private readonly query = signal('');
  private readonly countryInput = viewChild<ElementRef<HTMLInputElement>>('countryInput');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly groups = CONTINENTS.map((continent) => ({
    continent,
    countries: COUNTRIES.filter((country) => country.continent === continent),
  }));
  /** Spartan calls this while drawing the list, so it follows `query` rather than the live keystrokes. */
  protected readonly filter = (name: string): boolean => matchesCountry(name, this.query());

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.searchTimer));
    // Runs before the combobox reads the keystroke, so letters added onto the chosen country
    // become the search instead of "United Statesfr".
    afterNextRender(() => {
      const element = this.countryInput()?.nativeElement;
      if (!element) {
        return;
      }
      const rewrite = (event: Event) => this.rewriteFirstLetters(event);
      element.addEventListener('input', rewrite, true);
      destroyRef.onDestroy(() => element.removeEventListener('input', rewrite, true));
    });
  }

  /**
   * A chosen country fills the field, and the caret sits at its end, so the first letters are
   * appended to that name. Keep just the new letters. Editing the name itself, or clearing it,
   * is left as typed.
   */
  private rewriteFirstLetters(event: Event): void {
    const input = event.target;
    const chosen = this.chosenName();
    if (!(input instanceof HTMLInputElement) || !chosen || this.query() !== '') {
      return;
    }
    const next = input.value;
    let typed: string | undefined;
    if (next.startsWith(chosen) && next.length > chosen.length) {
      typed = next.slice(chosen.length);
    } else if (next.endsWith(chosen) && next.length > chosen.length) {
      typed = next.slice(0, -chosen.length);
    }
    if (typed === undefined) {
      return;
    }
    input.value = typed;
  }

  private chosenName(): string {
    const value = this.field()().value();
    return typeof value === 'string' && value ? this.itemToString()(value) : '';
  }

  protected onSearch(next: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = undefined;
    if (!next) {
      this.query.set('');
      return;
    }
    this.searchTimer = setTimeout(() => this.query.set(next), SEARCH_WAIT_MS);
  }

  private readonly messages = fieldMessages(this.field, this.inputId, this.hint);
  protected readonly errorShown = this.messages.errorShown;
  protected readonly error = this.messages.error;
  protected readonly describedBy = this.messages.describedBy;
}
