export class StockLimitError extends Error {
  readonly stock: number;

  constructor(stock: number) {
    super(stock === 0 ? 'That size is out of stock.' : `Only ${stock} of that size are in stock.`);
    this.name = 'StockLimitError';
    this.stock = stock;
  }
}

export class ShopRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopRuleError';
  }
}

export interface CartLine {
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export function addLine(
  lines: readonly CartLine[],
  productId: string,
  variantId: string,
  quantity: number,
  stock: number,
): CartLine[] {
  assertWholeQuantity(quantity, false);
  const existing = lines.find((line) => line.variantId === variantId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > stock) {
    throw new StockLimitError(stock);
  }
  if (!existing) {
    return [...lines, { productId, variantId, quantity: nextQuantity }];
  }
  return lines.map((line) => (line.variantId === variantId ? { ...line, quantity: nextQuantity } : line));
}

export function changeQuantity(
  lines: readonly CartLine[],
  variantId: string,
  quantity: number,
  stock: number,
): CartLine[] {
  assertWholeQuantity(quantity, true);
  if (quantity === 0) {
    return lines.filter((line) => line.variantId !== variantId);
  }
  if (quantity > stock) {
    throw new StockLimitError(stock);
  }
  return lines.map((line) => (line.variantId === variantId ? { ...line, quantity } : line));
}

function assertWholeQuantity(quantity: number, allowZero: boolean): void {
  const lowest = allowZero ? 0 : 1;
  if (!Number.isInteger(quantity) || quantity < lowest) {
    throw new ShopRuleError('Quantity must be a whole number.');
  }
}
