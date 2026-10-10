import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShopButtonImports } from './shop-button';

@Component({
  imports: [ShopButtonImports],
  template: `
    <button hlmBtn>Add to bag</button>
    <button hlmBtn size="sm" variant="outline">Try again</button>
    <button hlmBtn variant="link" size="sm">Remove</button>
    <button hlmBtn disabled>Placing order</button>
  `,
})
class Buttons {}

describe('ShopButton', () => {
  async function buttons(): Promise<HTMLButtonElement[]> {
    const fixture = TestBed.createComponent(Buttons);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  }

  it('gives a decision the shop height and keeps Spartan in charge of the variant', async () => {
    const [primary, outline] = await buttons();

    expect(primary.dataset['slot']).toBe('button');
    expect(primary.classList).toContain('h-12');
    expect(primary.classList).toContain('bg-primary');
    expect(primary.classList).not.toContain('h-8');
    expect(outline.classList).toContain('h-9');
    expect(outline.classList).toContain('border-foreground');
  });

  it('draws a text action as an underlined link with a full touch target', async () => {
    const [, , link] = await buttons();

    expect(link.classList).toContain('underline');
    expect(link.classList).toContain('min-h-11');
    expect(link.classList).not.toContain('h-9');
  });

  it('disables through Spartan so the button leaves the tab order', async () => {
    const [, , , disabled] = await buttons();

    expect(disabled.disabled).toBe(true);
    expect(disabled.hasAttribute('data-disabled')).toBe(true);
    expect(disabled.classList).toContain('data-disabled:bg-surface-strong');
  });
});
