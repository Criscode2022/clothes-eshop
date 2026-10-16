import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../i18n/translate.pipe';
import { clothColor } from '../shop/catalog';
import { portraitOf } from '../shop/cloth';

/** A piece's photograph in its cloth color, or a quiet stand-in in that color when there is no photograph of it yet. */
@Component({
  selector: 'app-piece-photo',
  imports: [NgOptimizedImage, TranslatePipe],
  template: `
    @if (portrait(); as photo) {
      <picture>
        <source type="image/avif" [srcset]="photo.avif" />
        <source type="image/jpeg" [srcset]="photo.jpeg" />
        <img
          [ngSrc]="photo.avif"
          width="800"
          height="1200"
          [priority]="priority()"
          [alt]="alt() | t"
          [style.view-transition-name]="transitionName() || null"
        />
      </picture>
    } @else {
      <div class="stand-in" [style.view-transition-name]="transitionName() || null">
        <span class="swatch" [style.background]="swatch()"></span>
        <span class="stand-in__note">{{ 'No photograph yet' | t }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      container-type: inline-size;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .stand-in {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 0.75rem;
      height: 100%;
      background: var(--color-surface);
    }

    .stand-in .swatch {
      width: 2.5rem;
      height: 2.5rem;
    }

    .stand-in__note {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    @container (width < 8rem) {
      .stand-in .swatch {
        width: 1rem;
        height: 1rem;
      }

      .stand-in__note {
        display: none;
      }
    }
  `,
})
export class PiecePhoto {
  readonly pieceId = input.required<string>();
  /** The cloth color to show: the photograph in that color, or the stand-in's swatch when there is none. */
  readonly color = input('');
  readonly alt = input('');
  readonly priority = input(false);
  /** Names the photograph for the view transition between the floor and the piece's page. */
  readonly transitionName = input('');

  protected readonly portrait = computed(() => portraitOf(this.pieceId(), this.color()));
  protected readonly swatch = computed(() => {
    const color = clothColor(this.color());
    return color === 'transparent' ? 'var(--color-surface-strong)' : color;
  });
}
