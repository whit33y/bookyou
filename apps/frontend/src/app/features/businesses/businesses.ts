import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DiscoveryService } from '../../core/services/discovery.service';

@Component({
  selector: 'app-businesses',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './businesses.html',
})
export class BusinessesComponent implements OnInit {
  protected readonly discoveryService = inject(DiscoveryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly cityFilter = signal('');
  readonly citySearch = signal('');
  readonly categoryFilter = signal('');
  readonly cityDropdownOpen = signal(false);

  private readonly searchSubject = new Subject<void>();

  readonly filteredCities = computed(() => {
    const search = this.citySearch().toLowerCase();
    const cities = this.discoveryService.cities();
    if (!search) return cities;
    return cities.filter((c) => c.toLowerCase().includes(search));
  });

  readonly resultLabel = computed(() => {
    const total = this.discoveryService.total();
    if (total === 1) return '1 wynik';
    const lastDigit = total % 10;
    const lastTwoDigits = total % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
      return `${total} wyniki`;
    }
    return `${total} wyników`;
  });

  ngOnInit() {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchBusinesses());

    this.discoveryService.loadCities();
    this.fetchBusinesses();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.searchSubject.next();
  }

  onCitySearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.citySearch.set(target.value);
    this.cityDropdownOpen.set(true);
  }

  onCategoryInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.categoryFilter.set(target.value);
    this.searchSubject.next();
  }

  selectCity(city: string) {
    this.cityFilter.set(city);
    this.citySearch.set(city);
    this.cityDropdownOpen.set(false);
    this.fetchBusinesses();
  }

  clearCity() {
    this.cityFilter.set('');
    this.citySearch.set('');
    this.cityDropdownOpen.set(false);
    this.fetchBusinesses();
  }

  toggleCityDropdown() {
    this.cityDropdownOpen.set(!this.cityDropdownOpen());
  }

  private fetchBusinesses() {
    this.discoveryService.loadBusinesses({
      search: this.searchQuery() || undefined,
      city: this.cityFilter() || undefined,
      category: this.categoryFilter() || undefined,
    });
  }
}
