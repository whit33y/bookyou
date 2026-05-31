import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class BusinessesComponent implements OnInit {
  protected readonly discoveryService = inject(DiscoveryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  readonly searchQuery = signal('');
  readonly cityFilter = signal('');
  readonly citySearch = signal('');
  readonly categoryFilter = signal('');
  readonly cityDropdownOpen = signal(false);
  readonly activeCityIndex = signal(-1);

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

  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cityDropdownOpen.set(false);
      this.citySearch.set(this.cityFilter());
      this.activeCityIndex.set(-1);
    }
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.searchSubject.next();
  }

  onCitySearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.citySearch.set(value);
    this.activeCityIndex.set(-1);
    if (!value) {
      this.cityFilter.set('');
      this.fetchBusinesses();
    }
    this.cityDropdownOpen.set(true);
  }

  onCityKeydown(event: KeyboardEvent) {
    const cities = this.filteredCities();
    if (!this.cityDropdownOpen() || cities.length === 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.cityDropdownOpen.set(true);
        this.activeCityIndex.set(0);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeCityIndex.set(Math.min(this.activeCityIndex() + 1, cities.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeCityIndex.set(Math.max(this.activeCityIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeCityIndex() >= 0) {
          this.selectCity(cities[this.activeCityIndex()]);
        }
        break;
      case 'Escape':
        this.cityDropdownOpen.set(false);
        this.citySearch.set(this.cityFilter());
        this.activeCityIndex.set(-1);
        break;
    }
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
    this.activeCityIndex.set(-1);
    this.fetchBusinesses();
  }

  clearCity() {
    this.cityFilter.set('');
    this.citySearch.set('');
    this.cityDropdownOpen.set(false);
    this.activeCityIndex.set(-1);
    this.fetchBusinesses();
  }

  private fetchBusinesses() {
    this.discoveryService.loadBusinesses({
      search: this.searchQuery() || undefined,
      city: this.cityFilter() || undefined,
      category: this.categoryFilter() || undefined,
    });
  }
}
