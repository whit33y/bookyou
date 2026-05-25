import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DiscoveryService } from '../../core/services/discovery.service';

@Component({
  selector: 'app-businesses',
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './businesses.html',
})
export class BusinessesComponent implements OnInit {
  protected readonly discoveryService = inject(DiscoveryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly cityFilter = signal('');

  private readonly searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchBusinesses());

    this.fetchBusinesses();
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onCityChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cityFilter.set(value);
    this.fetchBusinesses();
  }

  private fetchBusinesses() {
    this.discoveryService.loadBusinesses({
      search: this.searchQuery() || undefined,
      city: this.cityFilter() || undefined,
    });
  }
}
