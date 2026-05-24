import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section
      aria-labelledby="hero-heading"
      class="w-full bg-gradient-to-br from-indigo-600 to-indigo-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
    >
      <div class="mx-auto max-w-4xl text-center">
        <h1
          id="hero-heading"
          class="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Zarezerwuj wizytę u najlepszych specjalistów
        </h1>
        <p class="mt-4 text-lg text-indigo-100 sm:mt-6 sm:text-xl">
          Znajdź i zarezerwuj usługi beauty, wellness i zdrowotne w kilka sekund.
        </p>
        <div class="mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:flex-row sm:justify-center">
          <a
            routerLink="/register"
            class="inline-flex w-full items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 sm:w-auto"
          >
            Dołącz za darmo
          </a>
          <a
            routerLink="/login"
            class="inline-flex w-full items-center justify-center rounded-md border border-white px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 sm:w-auto"
          >
            Zaloguj się
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HeroSectionComponent {}
