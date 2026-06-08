import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Low-level skeleton primitive: a single pulsing placeholder block.
 * Compose several of these to mirror the real content layout while it loads,
 * which keeps the transition free of layout shift / flicker.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="animate-pulse bg-gray-200 dark:bg-gray-700"
      [class]="rounded()"
      [style.width]="width()"
      [style.height]="height()"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  /** CSS width value (e.g. `100%`, `12rem`). */
  readonly width = input('100%');
  /** CSS height value (e.g. `1rem`, `8rem`). */
  readonly height = input('1rem');
  /** Tailwind rounding utility (e.g. `rounded`, `rounded-full`, `rounded-lg`). */
  readonly rounded = input('rounded');
}
