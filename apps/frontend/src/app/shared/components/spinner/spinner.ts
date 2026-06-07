import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

/**
 * Reusable loading spinner. Inherits `currentColor`, so it adapts to the
 * surrounding text colour (e.g. white inside a primary button).
 *
 * Decorative by default (`aria-hidden`) since it usually sits next to visible
 * status text. Provide a `label` to expose it as a standalone live status.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <svg
      class="animate-spin text-current"
      [class]="sizeClass()"
      viewBox="0 0 24 24"
      fill="none"
      [attr.role]="label() ? 'status' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  `,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  /** When set, the spinner is announced as a live status with this label. */
  readonly label = input('');

  readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);
}
