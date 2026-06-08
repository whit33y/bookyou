import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/50"
      (click)="onBackdropClick($event)"
    >
      <div
        class="w-full max-w-sm animate-modal-in rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        (keydown.escape)="cancelled.emit()"
      >
        <h2 id="confirm-modal-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ title() }}
        </h2>
        <p id="confirm-modal-message" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ message() }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  readonly title = input('Potwierdzenie');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Potwierdź');
  readonly cancelLabel = input('Wróć');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }
}
