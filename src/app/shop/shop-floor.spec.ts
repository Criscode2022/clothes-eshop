import { SEED_PRODUCTS, cloneProducts, isSoldOut, variantsByColor } from './catalog';
import { readStoredBag, writeStoredBag } from './bag-storage';
import { centsFromDollars, dollarsFromCents, freeShippingProgress } from './money';
import { stockNote, stockState } from './stock';

describe('stock states', () => {
  it('reads a size as sold out, last few, or in stock', () => {
    expect(stockState(0)).toBe('sold-out');
    expect(stockState(1)).toBe('low');
    expect(stockState(2)).toBe('low');
    expect(stockState(3)).toBe('in-stock');

    expect(stockNote(0)).toBe('Sold out');
    expect(stockNote(1)).toBe('Only 1 left');
    expect(stockNote(2)).toBe('Only 2 left');
    expect(stockNote(8)).toBe('In stock');
  });
});

describe('sizes by color', () => {
  it('groups a piece’s sizes under each color in floor order', () => {
    const overcoat = SEED_PRODUCTS.find((product) => product.id === 'wool-overcoat');
    expect(overcoat).toBeTruthy();
    if (!overcoat) {
      return;
    }

    expect(
      variantsByColor(overcoat).map((group) => [
        group.color,
        group.variants.map((variant) => variant.size),
      ]),
    ).toEqual([
      ['Charcoal', ['46', '48']],
      ['Camel', ['50']],
    ]);
  });

  it('leads with the cover color when the catalog lists another color first', () => {
    const shirt = SEED_PRODUCTS.find((product) => product.id === 'oxford-shirt');
    expect(shirt).toBeTruthy();
    if (!shirt) {
      return;
    }
    const inkFirst = {
      ...shirt,
      variants: [...shirt.variants].sort((a, b) => a.color.localeCompare(b.color)),
    };

    expect(variantsByColor(inkFirst).map((group) => group.color)).toEqual(['White', 'Ink']);
  });

  it('calls a piece sold out only when no size is left', () => {
    const [shirt] = cloneProducts(SEED_PRODUCTS.filter((product) => product.id === 'oxford-shirt'));
    expect(shirt && isSoldOut(shirt)).toBe(false);
    expect(
      shirt &&
        isSoldOut({
          ...shirt,
          variants: shirt.variants.map((variant) => ({ ...variant, stock: 0 })),
        }),
    ).toBe(true);
  });
});

describe('free shipping meter', () => {
  it('fills toward $200 and stays full past it', () => {
    expect(freeShippingProgress(0)).toBe(0);
    expect(freeShippingProgress(5_000)).toBe(0.25);
    expect(freeShippingProgress(20_000)).toBe(1);
    expect(freeShippingProgress(42_000)).toBe(1);
  });
});

describe('prices in dollars', () => {
  it('converts the owner’s dollar entry to whole cents without drift', () => {
    expect(centsFromDollars(420)).toBe(42_000);
    expect(centsFromDollars(89.99)).toBe(8_999);
    expect(centsFromDollars(0.1 + 0.2)).toBe(30);
    expect(dollarsFromCents(8_950)).toBe(89.5);
  });
});

describe('saved bag', () => {
  const products = cloneProducts(SEED_PRODUCTS);

  function storageWith(
    value: string | null,
  ): Pick<Storage, 'getItem' | 'setItem'> & { saved: string | null } {
    return {
      saved: value,
      getItem() {
        return this.saved;
      },
      setItem(_key: string, next: string) {
        this.saved = next;
      },
    };
  }

  it('keeps lines whose size is still on the floor and caps them at stock', () => {
    const storage = storageWith(
      JSON.stringify([
        { productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 5 },
        { productId: 'merino-crew', variantId: 'merino-crew-l-ink', quantity: 1 },
        { productId: 'gone', variantId: 'gone-m', quantity: 1 },
        { productId: 'silk-tunic', variantId: 'silk-tunic-m-ivory', quantity: 1.5 },
        { productId: 'silk-tunic', variantId: 'silk-tunic-s-ivory', quantity: 1 },
      ]),
    );

    expect(readStoredBag(storage, products)).toEqual([
      { productId: 'oxford-shirt', variantId: 'oxford-shirt-s-white', quantity: 2 },
      { productId: 'silk-tunic', variantId: 'silk-tunic-s-ivory', quantity: 1 },
    ]);
  });

  it('starts empty when nothing or something unreadable was saved', () => {
    expect(readStoredBag(storageWith(null), products)).toEqual([]);
    expect(readStoredBag(storageWith('not json'), products)).toEqual([]);
    expect(readStoredBag(storageWith('{"productId":"oxford-shirt"}'), products)).toEqual([]);
  });

  it('writes the lines back as they are', () => {
    const storage = storageWith(null);
    const lines = [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 2 }];

    writeStoredBag(storage, lines);

    expect(readStoredBag(storage, products)).toEqual(lines);
  });
});
