import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  Business,
  CreateBusinessRequest,
  CreateServiceRequest,
  Service,
  UpdateBusinessRequest,
  UpdateServiceRequest,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly businessesUrl = `${environment.apiUrl}/businesses`;
  private readonly servicesUrl = `${environment.apiUrl}/services`;

  readonly business = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly loading = signal(false);
  readonly businessId = computed(() => this.business()?.id);

  loadMyBusiness() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.http.get<Business[]>(this.businessesUrl).subscribe({
      next: (businesses) => {
        const mine = businesses.find((b) => b.ownerId === user.id) ?? null;
        this.business.set(mine);
        if (mine) {
          this.loadServices(mine.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  create(data: CreateBusinessRequest) {
    return this.http
      .post<Business>(this.businessesUrl, data)
      .pipe(tap((b) => this.business.set(b)));
  }

  update(id: string, data: UpdateBusinessRequest) {
    return this.http
      .patch<Business>(`${this.businessesUrl}/${id}`, data)
      .pipe(tap((b) => this.business.set(b)));
  }

  createService(businessId: string, data: CreateServiceRequest) {
    return this.http
      .post<Service>(`${this.servicesUrl}/businesses/${businessId}`, data)
      .pipe(tap((s) => this.services.update((list) => [...list, s])));
  }

  updateService(id: string, data: UpdateServiceRequest) {
    return this.http
      .patch<Service>(`${this.servicesUrl}/${id}`, data)
      .pipe(
        tap((updated) =>
          this.services.update((list) => list.map((s) => (s.id === updated.id ? updated : s))),
        ),
      );
  }

  deleteService(id: string) {
    return this.http
      .delete<Service>(`${this.servicesUrl}/${id}`)
      .pipe(tap(() => this.services.update((list) => list.filter((s) => s.id !== id))));
  }

  private loadServices(businessId: string) {
    this.http.get<Service[]>(`${this.servicesUrl}/businesses/${businessId}`).subscribe({
      next: (services) => {
        this.services.set(services);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
