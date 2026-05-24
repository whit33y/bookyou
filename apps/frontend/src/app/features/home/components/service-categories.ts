import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ServiceCategory {
  icon: string;
  name: string;
}

const CATEGORIES: ServiceCategory[] = [
  { icon: '💇‍♀️', name: 'Fryzjer' },
  { icon: '💈', name: 'Barber' },
  { icon: '💅', name: 'Kosmetyczka' },
  { icon: '💆‍♀️', name: 'Masaż' },
  { icon: '🧖‍♀️', name: 'SPA' },
  { icon: '🏋️', name: 'Fizjoterapia' },
];

@Component({
  selector: 'app-service-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="categories-heading"
      class="w-full bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div class="mx-auto max-w-5xl">
        <h2
          id="categories-heading"
          class="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
        >
          Nasi specjaliści
        </h2>
        <div class="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:grid-cols-3 md:grid-cols-6" role="list">
          @for (category of categories; track category.name) {
            <div
              role="listitem"
              class="flex flex-col items-center gap-2 rounded-lg bg-white p-4 shadow-sm"
            >
              <span class="text-3xl" aria-hidden="true">{{ category.icon }}</span>
              <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class ServiceCategoriesComponent {
  readonly categories = CATEGORIES;
}
