import { validate } from '@angular/forms/signals';
import type { SchemaPath } from '@angular/forms/signals';
import { emailProblem, nameProblem } from '../shop/address-rules';

/** A rule's message as a form error; no message, no error. */
export function ruleError(message: string | null): { kind: 'rule'; message: string } | null {
  return message ? { kind: 'rule', message } : null;
}

/** A person's name, by the rule checkout and the server use: letters in any script, 2 to 80 of them. */
export function personName(path: SchemaPath<string>): void {
  validate(path, ({ value }) => ruleError(nameProblem(value())));
}

/**
 * An email with a dot in its domain, as checkout asks. Angular's own `email()` accepts `name@domain`.
 * An empty field is left to the form's `required`, which says what to type in its own words.
 */
export function emailAddress(path: SchemaPath<string>): void {
  validate(path, ({ value }) => (value().trim() ? ruleError(emailProblem(value())) : null));
}

const STOCK_MESSAGE = 'Stock is a whole number, 0 or more.';

/** Pieces on hand: a whole number, 0 or more. An empty number field reads as no number at all. */
export function wholeStock(path: SchemaPath<number>): void {
  validate(path, ({ value }) => {
    const stock = value();
    return Number.isInteger(stock) && stock >= 0 ? null : ruleError(STOCK_MESSAGE);
  });
}
