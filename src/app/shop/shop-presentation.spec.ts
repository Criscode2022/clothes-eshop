import { existsSync, readFileSync } from 'node:fs';

describe('shop presentation setup', () => {
  const styles = readFileSync('src/styles.scss', 'utf8');
  const tailwind = readFileSync('src/tailwind.css', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const angular = readFileSync('angular.json', 'utf8');
  const checkout = readFileSync('src/app/pages/checkout/checkout.html', 'utf8');
  const bag = readFileSync('src/app/pages/bag/bag.html', 'utf8');

  it('uses Tailwind v4 tokens, server rendering, and no Ionic or native shell', () => {
    expect(tailwind).toContain("@import 'tailwindcss'");
    expect(tailwind).not.toContain('@tailwind');
    expect(tailwind).toContain('--color-accent: var(--color-accent)');
    expect(existsSync('tailwind.config.js')).toBe(false);
    expect(pkg.devDependencies['tailwindcss']).toMatch(/4\./);
    expect(pkg.dependencies['@angular/ssr']).toBeTruthy();
    expect(pkg.dependencies['@ionic/angular']).toBeUndefined();
    expect(pkg.dependencies['@angular/pwa']).toBeUndefined();
    expect(pkg.devDependencies['@angular/pwa']).toBeUndefined();
    expect(pkg.dependencies['@ng-native/schematics']).toBeUndefined();
    expect(pkg.devDependencies['@ng-native/schematics']).toBeUndefined();
    expect(angular).not.toContain('"allowedHosts": ["*"]');
    expect(angular).not.toContain('"allowedHosts": "*"');
    expect(angular).toContain('"marlow.shop"');
  });

  it('animates the bag and checkout steps and reduces that motion', () => {
    expect(bag).toContain('animate.enter="line-enter"');
    expect(checkout).toContain('animate.enter="step-enter"');
    expect(checkout).toContain('animate.leave="step-leave"');
    expect(styles).toContain('@keyframes line-enter');
    expect(styles).toContain('@keyframes step-enter');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).not.toContain('@angular/animations');
  });
});
