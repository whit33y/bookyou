import { ChangeDetectionStrategy, Component } from '@angular/core';

interface HowItWorksStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: HowItWorksStep[] = [
  {
    icon: '🔍',
    title: 'Znajdź',
    description: 'Wyszukaj specjalistę lub usługę w Twojej okolicy.',
  },
  {
    icon: '📅',
    title: 'Zarezerwuj',
    description: 'Wybierz dogodny termin i zarezerwuj wizytę online.',
  },
  {
    icon: '✅',
    title: 'Gotowe',
    description: 'Otrzymaj potwierdzenie i ciesz się wizytą.',
  },
];

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="how-it-works-heading"
      class="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <div class="mx-auto max-w-5xl">
        <h2
          id="how-it-works-heading"
          class="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
        >
          Jak to działa?
        </h2>
        <ol
          class="mt-10 flex flex-col items-center gap-8 sm:mt-12 md:flex-row md:items-start md:justify-center md:gap-12"
          aria-label="Kroki rezerwacji"
        >
          @for (step of steps; track step.title; let i = $index) {
            <li class="flex flex-col items-center text-center md:flex-1">
              <span
                class="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl"
                aria-hidden="true"
              >
                {{ step.icon }}
              </span>
              <span class="mt-2 text-sm font-medium text-indigo-600"> Krok {{ i + 1 }} </span>
              <h3 class="mt-2 text-lg font-semibold text-gray-900">
                {{ step.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                {{ step.description }}
              </p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class HowItWorksComponent {
  readonly steps: HowItWorksStep[] = STEPS;
}
