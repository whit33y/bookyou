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
  templateUrl: './businesses.html',
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
