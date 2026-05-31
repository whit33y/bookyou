import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  loadCategories() {
    if (this.categories().length > 0) return;
    this.loading.set(true);
    this.http
      .get<Category[]>(this.apiUrl)
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.categories.set(data);
        this.loading.set(false);
      });
  }
}
