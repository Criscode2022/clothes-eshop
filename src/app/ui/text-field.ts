import { Component, computed, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';

/**
 * A labelled input bound to a Signal Forms field. Its first error shows once the field is touched,
 * and the input points at the error and the hint so screen readers announce them.
 */
@Component({
  selector: 'app-text-field',
  imports: [FormField],
  host: { class: 'field' },
  template: `
    <label class="field__label" [for]="inputId()">{{ label() }}</label>
    <input
      class="input"
      [id]="inputId()"
      [type]="type()"
      [attr.autocomplete]="autocomplete() || null"
      [attr.inputmode]="inputMode() || null"
      [formField]="field()"
      [attr.aria-invalid]="errorShown()"
      [attr.aria-describedby]="describedBy()"
    />
    @if (hint()) {
      <p class="field__hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
    @if (errorShown()) {
      <p class="field__error" [id]="inputId() + '-error'">{{ error() }}</p>
    }
  `,
})
export class TextField {
  readonly field = input.required<Field<string>>();
  /** The input's id. Named apart from `id` so the attribute lands on the input, not the host. */
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel' | 'password' | 'search'>('text');
  readonly autocomplete = input('');
  readonly inputMode = input<'' | 'numeric'>('');
  readonly hint = input('');

  protected readonly errorShown = computed(() => {
    const state = this.field()();
    return state.touched() && state.invalid();
  });
  protected readonly error = computed(() => this.field()().errors()[0]?.message ?? '');
  protected readonly describedBy = computed(() => {
    const ids = [
      this.hint() ? `${this.inputId()}-hint` : '',
      this.errorShown() ? `${this.inputId()}-error` : '',
    ];
    return ids.filter(Boolean).join(' ') || null;
  });
}
