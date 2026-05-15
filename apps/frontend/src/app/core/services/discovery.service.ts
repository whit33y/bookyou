import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Business } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;

  readonly businesses = signal<Business[]>([]);
  readonly selectedBusiness = signal<Business | null>(null);
  readonly loading = signal(false);

  loadBusinesses() {
    this.loading.set(true);
    this.http.get<Business[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.businesses.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadBusiness(id: string) {
    this.loading.set(true);
    this.http.get<Business>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.selectedBusiness.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.selectedBusiness.set(null);
        this.loading.set(false);
      },
    });
  }
}
