/** At or below this many, a size reads as one of the last few. */
const LAST_FEW = 2;

export type StockState = 'sold-out' | 'low' | 'in-stock';

export function stockState(stock: number): StockState {
  if (stock < 1) {
    return 'sold-out';
  }
  return stock <= LAST_FEW ? 'low' : 'in-stock';
}

/** What a shopper reads beside a size. */
export function stockNote(stock: number): string {
  switch (stockState(stock)) {
    case 'sold-out':
      return 'Sold out';
    case 'low':
      return `Only ${stock} left`;
    case 'in-stock':
      return 'In stock';
  }
}
