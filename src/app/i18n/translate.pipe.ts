import { Pipe, inject } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import { Language } from './language';
import { translate } from './translate';
import type { CopyParams } from './translate';

/**
 * `{{ 'Shop' | t }}` and `{{ 'Add {amount} more.' | t: { amount: goal } }}`.
 * The language is not one of the arguments, so this runs on each check and reads it.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly language = inject(Language);

  transform(value: string | null | undefined, params?: CopyParams): string {
    return translate(this.language.locale(), value ?? '', params);
  }
}
