import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiscoveryService } from '../../core/services/discovery.service';

@Component({
  selector: 'app-businesses',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900">Znajdź usługodawcę</h1>

      <div class="mt-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Szukaj po nazwie..."
          aria-label="Szukaj po nazwie"
          [value]="searchQuery()"
          (input)="onSearchChange($event)"
          class="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Miasto..."
          aria-label="Filtruj po mieście"
          [value]="cityFilter()"
          (input)="onCityChange($event)"
          class="rounded-md border border-gray-300 px-4 py-2 text-sm sm:w-48 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      @if (discoveryService.loading()) {
        <p class="mt-8 text-center text-gray-500">Ładowanie...</p>
      } @else if (filteredBusinesses().length === 0) {
        <p class="mt-8 text-center text-gray-500">Nie znaleziono usługodawców.</p>
      } @else {
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (business of filteredBusinesses(); track business.id) {
            <a
              [routerLink]="['/businesses', business.id]"
              class="block rounded-lg border border-gray-200 p-6 transition hover:border-indigo-300 hover:shadow-md"
            >
              <h2 class="text-lg font-semibold text-gray-900">{{ business.name }}</h2>
              <p class="mt-1 text-sm text-gray-500">{{ business.street }}, {{ business.city }}</p>
              @if (business.description) {
                <p class="mt-2 line-clamp-2 text-sm text-gray-600">{{ business.description }}</p>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class BusinessesComponent implements OnInit {
  protected readonly discoveryService = inject(DiscoveryService);

  readonly searchQuery = signal('');
  readonly cityFilter = signal('');

  readonly filteredBusinesses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const city = this.cityFilter().toLowerCase();

    return this.discoveryService.businesses().filter((b) => {
      const matchesName = !query || b.name.toLowerCase().includes(query);
      const matchesCity = !city || b.city.toLowerCase().includes(city);
      return matchesName && matchesCity;
    });
  });

  ngOnInit() {
    this.discoveryService.loadBusinesses();
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onCityChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.cityFilter.set(value);
  }
}
