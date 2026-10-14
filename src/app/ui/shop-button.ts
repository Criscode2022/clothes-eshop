import { Directive, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import type { ButtonVariants } from '@spartan-ng/helm/button';
import { classes } from '@spartan-ng/helm/utils';

type Variant = NonNullable<ButtonVariants['variant']>;
type Size = NonNullable<ButtonVariants['size']>;

/**
 * Marlow's hover and disabled looks on top of Spartan's variants: the black is the action, the rest stays
 * quiet until the pointer is on it. Spartan's `dark:` hovers follow the system theme, so ours name it too.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'hover:bg-primary/75 [a]:hover:bg-primary/75',
  outline:
    'border-foreground bg-transparent hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary',
  secondary: 'hover:bg-surface-strong',
  ghost: 'hover:bg-accent',
  destructive: 'hover:bg-destructive hover:text-canvas dark:hover:bg-destructive',
  link: 'h-auto min-h-11 px-0 font-normal text-foreground underline decoration-1 underline-offset-[0.22em] hover:decoration-2',
};

/** The shop's control heights: 3rem for a decision, 2.25rem inside table rows, 2.75rem touch targets for icons. */
const SIZE_CLASSES: Record<Size, string> = {
  default: 'h-12 gap-2 px-6 text-(length:--text-ui)',
  xs: 'h-8 gap-1 px-2.5 text-xs',
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  lg: 'h-14 gap-2 px-8 text-(length:--text-ui)',
  icon: 'size-11',
  'icon-xs': 'size-8',
  'icon-sm': 'size-9',
  'icon-lg': 'size-12',
};

const DISABLED_CLASSES =
  'data-disabled:opacity-100 data-disabled:border-transparent data-disabled:bg-surface-strong data-disabled:text-text-muted';

/**
 * Marlow's sizes on Spartan's button. It rides along on every `hlmBtn` in a template that imports
 * `ShopButtonImports`, so markup stays plain Spartan (`<button hlmBtn variant="outline">`) and the
 * generated Helm button stays as the CLI wrote it.
 */
@Directive({ selector: 'button[hlmBtn], a[hlmBtn]' })
export class ShopButton {
  constructor() {
    const button = inject(HlmButton);
    classes(() => {
      const variant = button.variant() ?? 'default';
      const size = button.size() ?? 'default';
      return [
        'font-medium tracking-[0.01em] aria-busy:cursor-progress [&_ng-icon]:text-[length:--spacing(4.5)]',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        variant === 'link' ? 'data-disabled:text-text-muted' : DISABLED_CLASSES,
      ];
    });
  }
}

/** Import this instead of HlmButton alone, so every button in the template gets the shop's sizes. */
export const ShopButtonImports = [HlmButton, ShopButton] as const;
