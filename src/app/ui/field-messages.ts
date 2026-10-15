import { computed } from '@angular/core';
import type { Field } from '@angular/forms/signals';

/**
 * When a field shows its error, which one, and what the control points at. The error shows once the
 * field is touched, which is when focus leaves it (or the form is sent), and stays up to date as the
 * person types; the control names the hint and the error so screen readers announce them.
 */
export function fieldMessages(
  field: () => Field<string>,
  inputId: () => string,
  hint: () => string,
) {
  const errorShown = computed(() => {
    const state = field()();
    return state.touched() && state.invalid();
  });
  const error = computed(() => field()().errors()[0]?.message ?? '');
  const describedBy = computed(() => {
    const ids = [hint() ? `${inputId()}-hint` : '', errorShown() ? `${inputId()}-error` : ''];
    return ids.filter(Boolean).join(' ') || null;
  });
  return { errorShown, error, describedBy };
}
