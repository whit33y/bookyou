import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Business } from '../../../core/models/business.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  template: `
    @if (businesses().length > 0) {
      <section aria-labelledby="recommendations-heading">
        <h2
          id="recommendations-heading"
          class="text-lg font-semibold text-gray-700 sm:text-xl dark:text-gray-200"
        >
          Polecane dla Ciebie
        </h2>

        <div
          class="mt-4 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-x-visible lg:grid-cols-3"
        >
          @for (business of businesses(); track business.id) {
            <a
              [routerLink]="'/businesses/' + business.id"
              class="min-w-[220px] flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 motion-reduce:transform-none sm:min-w-0 dark:border-gray-700 dark:bg-gray-800"
            >
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
                {{ business.name }}
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ business.city }}</p>

              @if (business.services && business.services.length > 0) {
                <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ business.services[0].name }}
                  · {{ business.services[0].price | currency: 'PLN' : 'symbol' : '1.0-2' }}
                </p>
              }
            </a>
          }
        </div>
      </section>
    }
  `,
})
export class RecommendationsComponent {
  readonly businesses = input.required<Business[]>();
}
