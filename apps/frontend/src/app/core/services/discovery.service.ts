import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Business, BusinessSearchParams, PaginatedResponse } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;

  private readonly loadAllTrigger = new Subject<BusinessSearchParams>();
  private readonly loadOneTrigger = new Subject<string>();

  readonly businesses = signal<Business[]>([]);
  readonly total = signal(0);
  readonly cities = signal<string[]>([]);
  readonly selectedBusiness = signal<Business | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.loadAllTrigger
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          const httpParams = this.buildParams(params);
          return this.http
            .get<PaginatedResponse<Business>>(this.apiUrl, { params: httpParams })
            .pipe(
              catchError(() => {
                this.loading.set(false);
                return of({
                  data: [],
                  total: 0,
                  limit: 20,
                  offset: 0,
                } as PaginatedResponse<Business>);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.businesses.set(response.data);
        this.total.set(response.total);
        this.loading.set(false);
      });

    this.loadOneTrigger
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          return this.http.get<Business>(`${this.apiUrl}/${id}`).pipe(
            catchError(() => {
              this.loading.set(false);
              this.selectedBusiness.set(null);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.selectedBusiness.set(data);
        this.loading.set(false);
      });
  }

  loadBusinesses(params: BusinessSearchParams = {}) {
    this.loadAllTrigger.next(params);
  }

  loadCities() {
    this.http
      .get<string[]>(`${this.apiUrl}/cities`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cities) => this.cities.set(cities));
  }

  loadBusiness(id: string) {
    this.loadOneTrigger.next(id);
  }

  private buildParams(params: BusinessSearchParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.offset != null) httpParams = httpParams.set('offset', params.offset.toString());
    return httpParams;
  }
}
