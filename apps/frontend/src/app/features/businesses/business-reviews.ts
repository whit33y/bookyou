import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewService } from '../../core/services/review.service';
import { Review, ReviewSort } from '../../core/models/review.model';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';

const PAGE_SIZE = 5;

interface SortOption {
  value: ReviewSort;
  label: string;
}

@Component({
  selector: 'app-business-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, MediaUrlPipe, StarRatingComponent],
  template: `
    <section aria-labelledby="reviews-heading">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-heading" class="text-lg font-semibold text-gray-900">Opinie</h2>
          @if (reviewCount() > 0) {
            <div class="mt-1 flex items-center gap-2">
              <app-star-rating [rating]="averageRating() ?? 0" size="sm" />
              <span class="text-sm font-medium text-gray-900">
                {{ averageRating() | number: '1.1-1' }}
              </span>
              <span class="text-sm text-gray-500">({{ reviewCount() }})</span>
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
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              @for (option of sortOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
        }
      </div>

      @if (loading()) {
        <p class="mt-4 text-sm text-gray-500">Ładowanie opinii...</p>
      } @else if (reviews().length === 0) {
        <p class="mt-4 text-sm text-gray-500">Ta firma nie ma jeszcze opinii.</p>
      } @else {
        <ul class="mt-4 space-y-4">
          @for (review of reviews(); track review.id) {
            <li class="rounded-lg border border-gray-200 p-4">
              <div class="flex items-center gap-3">
                @if (review.client.avatarUrl | mediaUrl; as avatarSrc) {
                  <img
                    [src]="avatarSrc"
                    [alt]="reviewerName(review) + ' avatar'"
                    class="h-9 w-9 rounded-full object-cover"
                  />
                } @else {
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600"
                    aria-hidden="true"
                  >
                    {{ reviewerInitial(review) }}
                  </div>
                }
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ reviewerName(review) }}</p>
                  <p class="text-xs text-gray-500">{{ review.createdAt | date: 'd MMM yyyy' }}</p>
                </div>
              </div>
              <div class="mt-2">
                <app-star-rating [rating]="review.rating" size="sm" />
              </div>
              @if (review.comment) {
                <p class="mt-2 text-sm text-gray-700">{{ review.comment }}</p>
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
              class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {{ loadingMore() ? 'Ładowanie...' : 'Pokaż więcej' }}
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class BusinessReviewsComponent implements OnInit {
  readonly businessId = input.required<string>();

  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly hasMore = computed(() => this.reviews().length < this.total());

  ngOnInit(): void {
    this.load(true);
  }

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
    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const offset = reset ? 0 : this.reviews().length;

    this.reviewService
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
