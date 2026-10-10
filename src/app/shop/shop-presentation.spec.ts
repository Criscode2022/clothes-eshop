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
    expect(tailwind).toContain("@import 'tailwindcss/utilities.css'");
    expect(tailwind).not.toContain('@tailwind');
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

  it('themes Spartan from the shop tokens and keeps its hover surface apart from the brand', () => {
    const components = JSON.parse(readFileSync('components.json', 'utf8')) as {
      componentsPath: string;
    };

    expect(components.componentsPath).toBe('src/app/ui/helm');
    expect(tailwind).toContain("@import '@spartan-ng/brain/hlm-tailwind-preset.css'");
    expect(tailwind).toContain('--primary: var(--color-accent)');
    expect(tailwind).toContain('--accent: var(--color-hover)');
    expect(tailwind).toContain('--radius: 0rem');
    expect(tailwind).not.toContain('--color-accent: var(--color-accent)');
    expect(tailwind).not.toContain('oklch(');
    expect(styles).toContain('--color-hover:');
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
    expect(styles).toContain("[data-slot='sheet-content']");
    expect(styles).toContain("[data-reveal='pending']");
    expect(styles).toContain('.count-bump');
    expect(styles).toContain('::view-transition-group(*)');
    expect(config).toContain('withViewTransitions');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).not.toContain('@angular/animations');
  });
});
