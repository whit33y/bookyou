import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Business } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;

  private readonly loadAllTrigger = new Subject<void>();
  private readonly loadOneTrigger = new Subject<string>();

  readonly businesses = signal<Business[]>([]);
  readonly selectedBusiness = signal<Business | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.loadAllTrigger
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          return this.http.get<Business[]>(this.apiUrl).pipe(
            catchError(() => {
              this.loading.set(false);
              return of([] as Business[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.businesses.set(data);
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

  loadBusinesses() {
    this.loadAllTrigger.next();
  }

  loadBusiness(id: string) {
    this.loadOneTrigger.next(id);
  }
}
