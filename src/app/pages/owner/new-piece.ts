import { Component, inject, signal } from '@angular/core';
import { FormField, form, min, minLength, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CATEGORIES } from '../../shop/catalog';
import { centsFromDollars } from '../../shop/money';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';
import { wholeStock } from '../../ui/form-rules';

/** A new piece goes on the floor with its first size and color; more sizes are added on its page. */
@Component({
  selector: 'app-new-piece',
  imports: [FormField, HlmAlertImports, HlmSpinner, NgIcon, ShopButtonImports, TextField, TranslatePipe],
  providers: [provideIcons({ lucideCircleAlert })],
  templateUrl: './new-piece.html',
  styles: `
    .new-piece {
      display: grid;
      gap: 2rem;
      max-width: 44rem;
    }

    .title {
      font-size: var(--text-md);
      letter-spacing: 0;
    }

    .group {
      display: grid;
      gap: 1.25rem 1rem;
      margin: 0;
      padding: 1.5rem 0 0;
      border: 0;
      border-top: 1px solid var(--color-border);

      @media (min-width: 40rem) {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        .span-2 {
          grid-column: 1 / -1;
        }
      }
    }

    .group__legend {
      float: left;
      grid-column: 1 / -1;
      width: 100%;
      margin-bottom: 0.25rem;
      padding: 0;
      font-size: var(--text-ui);
      font-weight: 600;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .note {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
  `,
})
export class NewPiece {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly model = signal({
    name: '',
    category: 'outerwear',
    dollars: 0,
    summary: '',
    size: '',
    color: '',
    stock: 1,
  });
  protected readonly pieceForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter a name for the piece.' });
    minLength(path.name, 2, { message: 'Enter a name for the piece.' });
    required(path.category, { message: 'Choose a category.' });
    min(path.dollars, 0.01, { message: 'Enter a price above $0.00.' });
    required(path.summary, { message: 'Write one line about the piece.' });
    required(path.size, { message: 'Enter the first size, like 48 or M.' });
    required(path.color, { message: 'Enter its color, like Charcoal.' });
    wholeStock(path.stock);
  });

  protected fieldError(state: { touched(): boolean; invalid(): boolean }): boolean {
    return state.touched() && state.invalid();
  }

  protected create(): void {
    this.errorMessage.set('');
    void submit(this.pieceForm, async () => {
      this.saving.set(true);
      const { dollars, ...piece } = this.model();
      try {
        const product = await this.shop.createProduct({
          ...piece,
          priceCents: centsFromDollars(dollars),
        });
        await this.router.navigate(['/owner/pieces'], { queryParams: { piece: product.id } });
      } catch (error) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'The piece could not be added.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }
}
