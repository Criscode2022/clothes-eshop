import { Pipe } from '@angular/core';
import { formatMoney } from './money';

@Pipe({ name: 'money' })
export class MoneyPipe {
  transform(cents: number): string {
    return formatMoney(cents);
  }
}
