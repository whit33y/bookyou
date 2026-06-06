import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { Appointment, AppointmentReview } from '../../core/models/appointment.model';
import { ReviewService } from '../../core/services/review.service';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';

const MAX_COMMENT_LENGTH = 1000;

@Component({
  selector: 'app-review-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, ReactiveFormsModule, StarRatingComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      (click)="onBackdropClick($event)"
    >
      <div
        class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        (keydown.escape)="closed.emit()"
      >
        <div class="flex items-center justify-between">
          <h2 id="review-modal-title" class="text-lg font-semibold text-gray-900">Oceń wizytę</h2>
          <button
            type="button"
            (click)="closed.emit()"
            class="text-gray-400 hover:text-gray-600"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        <p class="mt-2 text-sm text-gray-600">
          {{ appointment().business.name }} · {{ appointment().service.name }}
        </p>

        <div class="mt-4">
          <span id="review-rating-label" class="block text-sm font-medium text-gray-700">
            Twoja ocena
          </span>
          <div class="mt-1">
            <app-star-rating
              [rating]="rating()"
              [readonly]="false"
              size="lg"
              ariaLabel="Wybierz ocenę od 1 do 5 gwiazdek"
              (ratingChange)="onRatingChange($event)"
            />
          </div>
        </div>

        <div class="mt-4">
          <label for="review-comment" class="block text-sm font-medium text-gray-700">
            Komentarz (opcjonalnie)
          </label>
          <textarea
            id="review-comment"
            [formControl]="comment"
            rows="4"
            [maxlength]="maxLength"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Podziel się swoją opinią..."
          ></textarea>
          <p class="mt-1 text-right text-xs text-gray-400">
            {{ comment.value.length }}/{{ maxLength }}
          </p>
        </div>

        @if (errorMessage()) {
          <p class="mt-2 text-sm text-red-600" role="alert">{{ errorMessage() }}</p>
        }

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            (click)="closed.emit()"
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            (click)="submit()"
            [disabled]="rating() === 0 || submitting() || comment.invalid"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ submitting() ? 'Wysyłanie...' : 'Wyślij opinię' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReviewModalComponent {
  readonly appointment = input.required<Appointment>();
  readonly submitted = output<AppointmentReview>();
  readonly closed = output<void>();

  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxLength = MAX_COMMENT_LENGTH;
  readonly rating = signal(0);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly comment = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(MAX_COMMENT_LENGTH)],
  });

  onRatingChange(value: number): void {
    this.rating.set(value);
    this.errorMessage.set('');
  }

  submit(): void {
    if (this.rating() === 0 || this.submitting() || this.comment.invalid) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const comment = this.comment.value.trim();

    this.reviewService
      .create({
        appointmentId: this.appointment().id,
        rating: this.rating(),
        comment: comment || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (review) => {
          this.submitting.set(false);
          this.submitted.emit({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'Nie udało się wysłać opinii. Spróbuj ponownie.',
          );
        },
      });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
