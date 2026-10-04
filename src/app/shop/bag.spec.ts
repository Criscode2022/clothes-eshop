import { TestBed } from '@angular/core/testing';
import { Bag } from './bag';
import { BagDrawer } from './bag-drawer';
import { BagPersistence } from './bag-persistence';

describe('bag drawer', () => {
  it('adds a size and opens on that line', () => {
    const drawer = TestBed.inject(BagDrawer);

    const outcome = drawer.add('oxford-shirt', 'oxford-shirt-m-white');

    expect(outcome.added).toBe(true);
    expect(drawer.isOpen()).toBe(true);
    expect(drawer.justAdded()).toBe('oxford-shirt-m-white');
    expect(TestBed.inject(Bag).count()).toBe(1);
  });

  it('stays closed and says why when the size cannot be added', () => {
    const drawer = TestBed.inject(BagDrawer);

    const outcome = drawer.add('merino-crew', 'merino-crew-l-ink');

    expect(outcome).toEqual({ added: false, reason: 'That size is out of stock.' });
    expect(drawer.isOpen()).toBe(false);
    expect(TestBed.inject(Bag).noticeMessage()).toBe('That size is out of stock.');
  });

  it('forgets the added line once closed', () => {
    const drawer = TestBed.inject(BagDrawer);
    drawer.add('oxford-shirt', 'oxford-shirt-m-white');

    drawer.close();

    expect(drawer.isOpen()).toBe(false);
    expect(drawer.justAdded()).toBeNull();
  });
});

describe('bag persistence', () => {
  function fakeStorage(
    saved: string | null,
  ): Pick<Storage, 'getItem' | 'setItem'> & { saved: string | null } {
    return {
      saved,
      getItem() {
        return this.saved;
      },
      setItem(_key: string, value: string) {
        this.saved = value;
      },
    };
  }

  it('brings back the saved bag and saves every change after that', () => {
    const storage = fakeStorage(
      JSON.stringify([{ productId: 'silk-tunic', variantId: 'silk-tunic-s-ivory', quantity: 1 }]),
    );
    const bag = TestBed.inject(Bag);

    TestBed.inject(BagPersistence).start(storage);
    expect(bag.count()).toBe(1);

    bag.add('oxford-shirt', 'oxford-shirt-m-white');
    TestBed.tick();

    expect(JSON.parse(storage.saved ?? '[]')).toEqual([
      { productId: 'silk-tunic', variantId: 'silk-tunic-s-ivory', quantity: 1 },
      { productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 },
    ]);
  });
});
