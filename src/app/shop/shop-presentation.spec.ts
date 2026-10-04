import { existsSync, readFileSync } from 'node:fs';

describe('shop presentation setup', () => {
  const styles = readFileSync('src/styles.scss', 'utf8');
  const tailwind = readFileSync('src/tailwind.css', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const angular = readFileSync('angular.json', 'utf8');
  const bagLines = readFileSync('src/app/ui/bag-lines/bag-lines.html', 'utf8');
  const config = readFileSync('src/app/app.config.ts', 'utf8');

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

  it('self-hosts Archivo with its width axis and keeps colors on the tokens', () => {
    expect(pkg.dependencies['@fontsource-variable/archivo']).toBeTruthy();
    expect(angular).toContain('@fontsource-variable/archivo/wdth.css');
    expect(angular).not.toContain('newsreader');
    expect(styles).toContain("--font-body: 'Archivo Variable'");
    expect(styles).toContain('@media (prefers-color-scheme: dark)');
    expect(styles).toContain('@layer components');
  });

  it('animates the bag lines, the drawer, and route changes, and reduces that motion', () => {
    expect(bagLines).toContain('animate.enter="line-enter"');
    expect(bagLines).toContain('animate.leave="line-leave"');
    expect(styles).toContain('@starting-style');
    expect(styles).toContain('::view-transition-group(*)');
    expect(config).toContain('withViewTransitions');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).not.toContain('@angular/animations');
  });
});
