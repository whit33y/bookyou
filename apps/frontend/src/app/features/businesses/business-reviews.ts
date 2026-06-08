import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { ReviewService } from '../../core/services/review.service';
import { Review, ReviewSort } from '../../core/models/review.model';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

const PAGE_SIZE = 5;

interface SortOption {
  value: ReviewSort;
  label: string;
}

@Component({
  selector: 'app-business-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    MediaUrlPipe,
    StarRatingComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  template: `
    <section aria-labelledby="reviews-heading">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-heading" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Opinie
          </h2>
          @if (reviewCount() > 0) {
            <div class="mt-1 flex items-center gap-2">
              <app-star-rating [rating]="averageRating() ?? 0" size="sm" />
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ averageRating() | number: '1.1-1' }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">({{ reviewCount() }})</span>
            </div>
          }
        </div>

        @if (reviewCount() > 1) {
          <div>
            <label for="reviews-sort" class="sr-only">Sortuj opinie</label>
            <select
              id="reviews-sort"
              [value]="sort()"
              (change)="onSortChange($event)"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              @for (option of sortOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
        }
      </div>

      @if (loading()) {
        <ul class="mt-4 space-y-4" aria-busy="true" aria-label="Ładowanie opinii">
          @for (i of [1, 2, 3]; track i) {
            <li class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <app-skeleton width="2.25rem" height="2.25rem" rounded="rounded-full" />
                <div class="space-y-2">
                  <app-skeleton width="8rem" height="0.875rem" />
                  <app-skeleton width="5rem" height="0.75rem" />
                </div>
              </div>
              <app-skeleton class="mt-3 block" width="100%" height="0.875rem" />
            </li>
          }
        </ul>
      } @else if (reviews().length === 0) {
        <app-empty-state icon="inbox" title="Ta firma nie ma jeszcze opinii" [compact]="true" />
      } @else {
        <ul class="mt-4 space-y-4">
          @for (review of reviews(); track review.id) {
            <li class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div class="flex items-center gap-3">
                @if (review.client.avatarUrl | mediaUrl; as avatarSrc) {
                  <img
                    [src]="avatarSrc"
                    [alt]="reviewerName(review) + ' avatar'"
                    class="h-9 w-9 rounded-full object-cover"
                  />
                } @else {
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                    aria-hidden="true"
                  >
                    {{ reviewerInitial(review) }}
                  </div>
                }
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ reviewerName(review) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ review.createdAt | date: 'd MMM yyyy' }}
                  </p>
                </div>
              </div>
              <div class="mt-2">
                <app-star-rating [rating]="review.rating" size="sm" />
              </div>
              @if (review.comment) {
                <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{{ review.comment }}</p>
              }
            </li>
          }
        </ul>

        @if (hasMore()) {
          <div class="mt-4 text-center">
            <button
              type="button"
              (click)="loadMore()"
              [disabled]="loadingMore()"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {{ loadingMore() ? 'Ładowanie...' : 'Pokaż więcej' }}
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class BusinessReviewsComponent {
  readonly businessId = input.required<string>();

  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Reload whenever the businessId input changes, so the section stays correct
    // even if the parent reuses this component across different businesses.
    toObservable(this.businessId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(true));
  }

  protected readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Najnowsze' },
    { value: 'highest', label: 'Najwyżej oceniane' },
    { value: 'lowest', label: 'Najniżej oceniane' },
  ];

  readonly reviews = signal<Review[]>([]);
  readonly total = signal(0);
  readonly averageRating = signal<number | null>(null);
  readonly reviewCount = signal(0);
  readonly sort = signal<ReviewSort>('newest');
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  private loadSub?: Subscription;

  readonly hasMore = computed(() => this.reviews().length < this.total());

  /** Allows the parent to refresh the list after a new review is submitted. */
  reload(): void {
    this.load(true);
  }

  onSortChange(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as ReviewSort);
    this.load(true);
  }

  loadMore(): void {
    this.load(false);
  }

  private load(reset: boolean): void {
    // Cancel any in-flight request so a slower, older response can't overwrite
    // the state produced by this newer one.
    this.loadSub?.unsubscribe();

    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const offset = reset ? 0 : this.reviews().length;

    this.loadSub = this.reviewService
      .getBusinessReviews(this.businessId(), {
        sort: this.sort(),
        limit: PAGE_SIZE,
        offset,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reviews.update((current) =>
            reset ? response.data : [...current, ...response.data],
          );
          this.total.set(response.total);
          this.averageRating.set(response.averageRating);
          this.reviewCount.set(response.reviewCount);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  reviewerName(review: Review): string {
    return review.client.name ?? 'Klient';
  }

  reviewerInitial(review: Review): string {
    return this.reviewerName(review).charAt(0).toUpperCase();
  }
}
