import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-service-categories',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="categories-heading"
      class="w-full bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 dark:bg-gray-900"
    >
      <div class="mx-auto max-w-5xl">
        <h2
          id="categories-heading"
          class="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100"
        >
          Nasi specjaliści
        </h2>
        <ul class="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:grid-cols-3 md:grid-cols-6">
          @for (category of categoryService.categories(); track category.id) {
            <li>
              <a
                [routerLink]="['/businesses']"
                [queryParams]="{ category: category.slug }"
                class="flex flex-col items-center gap-2 rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md hover:border-indigo-300 border border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:bg-gray-800 dark:hover:border-indigo-500"
              >
                <span class="text-3xl" aria-hidden="true">{{ category.icon }}</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                  category.name
                }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class ServiceCategoriesComponent implements OnInit {
  protected readonly categoryService = inject(CategoryService);

  ngOnInit() {
    this.categoryService.loadCategories();
  }
}
