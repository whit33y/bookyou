import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

type StarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<StarSize, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

/**
 * Reusable star rating widget.
 *
 * - `readonly` (default): renders a non-interactive visualization that supports
 *   fractional values (e.g. 4.5) via a clipped overlay.
 * - interactive: an accessible radiogroup with roving focus and arrow-key
 *   navigation that emits `ratingChange` when the user picks a value.
 */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (readonly()) {
      <span class="inline-flex items-center" role="img" [attr.aria-label]="readonlyLabel()">
        <span class="relative inline-block leading-none" [class]="sizeClass()" aria-hidden="true">
          <span class="text-gray-300 dark:text-gray-600">★★★★★</span>
          <span
            class="absolute inset-y-0 left-0 overflow-hidden text-amber-400"
            [style.width.%]="fillPercent()"
          >
            ★★★★★
          </span>
        </span>
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-0.5"
        role="radiogroup"
        [attr.aria-label]="ariaLabel()"
        (keydown)="onKeydown($event)"
      >
        @for (star of stars; track star) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="rating() === star"
            [attr.aria-label]="star + ' z 5'"
            [tabindex]="rovingTabindex(star)"
            (click)="select(star)"
            (mouseenter)="hovered.set(star)"
            (mouseleave)="hovered.set(0)"
            class="rounded leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            [class]="sizeClass()"
            [class.text-amber-400]="star <= activeValue()"
            [class.text-gray-300]="star > activeValue()"
          >
            ★
          </button>
        }
      </span>
    }
  `,
})
export class StarRatingComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly rating = input(0);
  readonly readonly = input(true);
  readonly size = input<StarSize>('md');
  readonly ariaLabel = input('Wybierz ocenę');

  readonly ratingChange = output<number>();

  readonly hovered = signal(0);
  protected readonly stars = [1, 2, 3, 4, 5];

  readonly activeValue = computed(() => this.hovered() || this.rating());
  readonly fillPercent = computed(() => (Math.max(0, Math.min(5, this.rating())) / 5) * 100);
  readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);
  readonly readonlyLabel = computed(() => `Średnia ocena: ${this.rating().toFixed(1)} na 5`);

  select(star: number): void {
    if (this.readonly()) return;
    this.ratingChange.emit(star);
  }

  rovingTabindex(star: number): number {
    // The selected star is the single tab stop; default to the first otherwise.
    const selected = this.rating() || 1;
    return star === selected ? 0 : -1;
  }

  onKeydown(event: KeyboardEvent): void {
    const current = this.rating() || 0;
    let next = current;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(5, current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(1, current - 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    this.focusStar(next);
  }

  private focusStar(star: number): void {
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[star - 1]?.focus();
  }
}
