import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { clothColor } from '../shop/catalog';
import { portraitSrc } from '../shop/cloth';

/** A piece's photograph, or a quiet stand-in in its cloth color for pieces the owner has not photographed yet. */
@Component({
  selector: 'app-piece-photo',
  imports: [NgOptimizedImage],
  template: `
    @if (src(); as source) {
      <img
        [ngSrc]="source"
        width="800"
        height="1200"
        [priority]="priority()"
        [alt]="alt()"
        [style.view-transition-name]="transitionName() || null"
      />
    } @else {
      <div class="stand-in" [style.view-transition-name]="transitionName() || null">
        <span class="swatch" [style.background]="swatch()"></span>
        <span class="stand-in__note">No photograph yet</span>
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
  /** The cloth color the stand-in shows when there is no photograph. */
  readonly color = input('');
  readonly alt = input('');
  readonly priority = input(false);
  /** Names the photograph for the view transition between the floor and the piece's page. */
  readonly transitionName = input('');

  protected readonly src = computed(() => portraitSrc(this.pieceId()));
  protected readonly swatch = computed(() => {
    const color = clothColor(this.color());
    return color === 'transparent' ? 'var(--color-surface-strong)' : color;
  });
}
