import { isSafari, neonAuthBaseUrl } from './neon-auth';
import { NEON_AUTH_URL } from './neon-public';

const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const CHROME_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1';
const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const FIREFOX_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0';

describe('where the browser reaches Neon Auth', () => {
  it('knows Safari, and every browser on an iPhone or iPad, which all run on Safari', () => {
    expect([SAFARI_MAC, SAFARI_IPHONE, CHROME_IPHONE].map(isSafari)).toEqual([true, true, true]);
  });

  it('does not mistake Chrome, Edge, Android, or Firefox for Safari', () => {
    expect([CHROME_MAC, EDGE_WINDOWS, CHROME_ANDROID, FIREFOX_MAC].map(isSafari)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('sends Safari through the shop own domain, so its session cookie is first-party', () => {
    expect(neonAuthBaseUrl('https://marlow.shop', SAFARI_MAC)).toBe('https://marlow.shop/api/auth');
  });

  it('lets other browsers reach Neon Auth directly', () => {
    expect(neonAuthBaseUrl('https://marlow.shop', CHROME_MAC)).toBe(NEON_AUTH_URL);
  });
});
