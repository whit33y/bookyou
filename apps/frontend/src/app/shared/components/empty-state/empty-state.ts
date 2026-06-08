import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type EmptyStateIcon = 'calendar' | 'search' | 'inbox' | 'sparkles' | 'clipboard';

/**
 * Reusable empty-state: an illustrative icon, a title, an optional description
 * and an optional call-to-action. The CTA renders as a `routerLink` when
 * `ctaLink` is provided, otherwise as a button that emits `ctaClick` (e.g. to
 * open a modal). Pass `compact` for tight containers such as calendar cells.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center" [class]="paddingClass()">
      <div class="text-gray-300" [class]="iconSizeClass()" aria-hidden="true">
        <svg
          class="h-full w-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          @switch (icon()) {
            @case ('calendar') {
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            }
            @case ('search') {
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            }
            @case ('sparkles') {
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
              />
            }
            @case ('clipboard') {
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            }
            @default {
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
              />
            }
          }
        </svg>
      </div>

      <p [class]="titleClass()">{{ title() }}</p>

      @if (description()) {
        <p class="mt-1 max-w-sm text-sm text-gray-400">{{ description() }}</p>
      }

      @if (ctaLabel()) {
        @if (ctaLink(); as link) {
          <a
            [routerLink]="link"
            class="mt-5 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {{ ctaLabel() }}
          </a>
        } @else {
          <button
            type="button"
            (click)="ctaClick.emit()"
            class="mt-5 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {{ ctaLabel() }}
          </button>
        }
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<EmptyStateIcon>('inbox');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly ctaLabel = input('');
  /** When set, the CTA is a router link to this path; otherwise it emits `ctaClick`. */
  readonly ctaLink = input<string | null>(null);
  readonly compact = input(false);

  readonly ctaClick = output<void>();

  readonly paddingClass = computed(() => (this.compact() ? 'py-6' : 'py-12'));
  readonly iconSizeClass = computed(() => (this.compact() ? 'h-10 w-10' : 'h-14 w-14'));
  readonly titleClass = computed(() =>
    this.compact()
      ? 'mt-2 text-sm font-medium text-gray-600'
      : 'mt-4 text-base font-medium text-gray-700',
  );
}
