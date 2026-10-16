import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { portraitOf } from '../../shop/cloth';
import { Reveal } from '../../ui/reveal';
import { ShopButtonImports } from '../../ui/shop-button';

/** The flat lay beside the note on cloth: knit on linen, close enough to read the stitch. */
const CLOTH_PHOTO = 'merino-crew';

/** Under the floor: one photograph and the shop's own words on cloth and care, pointing to the atelier. */
@Component({
  selector: 'app-cloth-note',
  imports: [NgOptimizedImage, Reveal, RouterLink, ShopButtonImports, TranslatePipe],
  template: `
    @if (portrait; as photo) {
      <section class="note page" aria-labelledby="cloth-title" appReveal>
        <div class="note__photo">
          <picture>
            <source type="image/avif" [srcset]="photo.avif" />
            <source type="image/jpeg" [srcset]="photo.jpeg" />
            <img
              [ngSrc]="photo.avif"
              width="800"
              height="1200"
              [alt]="'Merino Crew Neck folded on linen' | t"
            />
          </picture>
        </div>
        <div class="note__text">
          <h2 id="cloth-title" class="note__title">{{ 'Cloth and care' | t }}</h2>
          <p class="note__lede">
            {{
              'Cloth is named on each piece, with the care it actually needs. Wool is brushed and aired. Cotton is washed. Silk is cleaned, not guessed at.'
                | t
            }}
          </p>
          <a hlmBtn variant="outline" routerLink="/atelier" class="justify-self-start">{{
            'Read about the atelier' | t
          }}</a>
        </div>
      </section>
    }
  `,
  styles: `
    .note {
      display: grid;
      gap: 2rem;
      margin-top: 6rem;

      @media (min-width: 48rem) {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: clamp(2.5rem, 6vw, 6rem);
      }
    }

    .note__photo {
      overflow: hidden;
      aspect-ratio: 4 / 5;
      background: var(--color-surface);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 50% 60%;
      }
    }

    .note__text {
      display: grid;
      gap: 1.5rem;
      max-width: 30rem;
    }

    .note__title {
      font-size: var(--text-display);
      font-weight: 450;
      letter-spacing: -0.03em;
    }

    .note__lede {
      font-size: var(--text-lg);
      line-height: 1.5;
      color: var(--color-text-muted);
    }
  `,
})
export class ClothNote {
  protected readonly portrait = portraitOf(CLOTH_PHOTO);
}
