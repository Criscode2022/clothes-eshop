/**
 * True when the path's last segment is a file name, such as `/chunk-AB12.js` or `/garments/coat.avif`.
 * No shop page has a dot in its last segment: product ids, categories, and order references are plain.
 */
export function isFilePath(path: string): boolean {
  return /\.[a-z0-9]+$/i.test(path.slice(path.lastIndexOf('/') + 1));
}
