import { neonAuthBaseUrl } from './neon-auth';

describe('where the browser reaches Neon Auth', () => {
  it('goes through the shop own domain, so the session cookie is first-party in every browser', () => {
    expect(neonAuthBaseUrl('https://marlow.shop')).toBe('https://marlow.shop/api/auth');
  });

  it('stays on the origin the page was opened from', () => {
    expect(neonAuthBaseUrl('http://localhost:4200')).toBe('http://localhost:4200/api/auth');
  });
});
