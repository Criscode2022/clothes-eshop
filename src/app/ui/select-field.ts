import { Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';
import { TranslatePipe } from '../i18n/translate.pipe';
import { fieldMessages } from './field-messages';

/**
 * A labelled native select bound to a Signal Forms field: a phone opens its own picker, and the
 * keyboard can jump by first letter. It starts on a prompt, not on the first option.
 */
@Component({
  selector: 'app-select-field',
  imports: [FormField, TranslatePipe],
  host: { class: 'field' },
  template: `
    <label class="field__label" [for]="inputId()">{{ label() | t }}</label>
    <select
      class="input"
      [id]="inputId()"
      [attr.autocomplete]="autocomplete() || null"
      [formField]="field()"
      [attr.aria-invalid]="errorShown()"
      [attr.aria-describedby]="describedBy()"
    >
      <option value="" disabled>{{ prompt() | t }}</option>
      @for (option of options(); track option) {
        <option [value]="option">{{ option | t }}</option>
      }
    </select>
    @if (hint()) {
      <p class="field__hint" [id]="inputId() + '-hint'">{{ hint() | t }}</p>
    }
    @if (errorShown()) {
      <p class="field__error" [id]="inputId() + '-error'">{{ error() | t }}</p>
    }
  `,
})
export class SelectField {
  readonly field = input.required<Field<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly prompt = input.required<string>();
  readonly autocomplete = input('');
  readonly hint = input('');

  private readonly messages = fieldMessages(this.field, this.inputId, this.hint);
  protected readonly errorShown = this.messages.errorShown;
  protected readonly error = this.messages.error;
  protected readonly describedBy = this.messages.describedBy;
}
