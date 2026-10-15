import { isFilePath } from './static-files';

describe('which requests are for files', () => {
  it('takes a path ending in a file name as a file, so a missing one answers 404', () => {
    expect(
      [
        '/chunk-BnLHnQsF.js',
        '/styles-LHOEB3W3.css',
        '/garments/wool-overcoat-camel.avif',
        '/favicon.ico',
        '/.well-known/appspecific/com.chrome.devtools.json',
      ].map(isFilePath),
    ).toEqual([true, true, true, true, true]);
  });

  it('takes every shop page as a page', () => {
    expect(
      [
        '/',
        '/checkout',
        '/product/oxford-shirt',
        '/category/shirts',
        '/order/MR-1003',
        '/desk/stock',
        '/reset-password',
      ].map(isFilePath),
    ).toEqual([false, false, false, false, false, false, false]);
  });
});
