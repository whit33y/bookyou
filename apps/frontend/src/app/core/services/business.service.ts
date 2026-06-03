import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, tap, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Business,
  CreateBusinessRequest,
  CreateServiceRequest,
  Service,
  UpdateBusinessRequest,
  UpdateServiceRequest,
} from '../models/business.model';
import { UploadService } from './upload.service';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly uploadService = inject(UploadService);
  private readonly businessesUrl = `${environment.apiUrl}/businesses`;
  private readonly servicesUrl = `${environment.apiUrl}/services`;

  readonly business = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly loading = signal(false);
  readonly businessId = computed(() => this.business()?.id);

  loadMyBusiness() {
    this.loading.set(true);
    this.http.get<Business>(`${this.businessesUrl}/mine`).subscribe({
      next: (business) => {
        this.business.set(business);
        this.loadServices(business.id);
      },
      error: () => {
        this.business.set(null);
        this.loading.set(false);
      },
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

  uploadLogo(file: File) {
    const id = this.businessId();
    if (!id) return EMPTY;
    return this.uploadService.uploadBusinessLogo(file, id).pipe(tap((b) => this.business.set(b)));
  }

  uploadCover(file: File) {
    const id = this.businessId();
    if (!id) return EMPTY;
    return this.uploadService.uploadBusinessCover(file, id).pipe(tap((b) => this.business.set(b)));
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

  getAvailableSlots(businessId: string, date: string, serviceId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.businessesUrl}/${businessId}/available-slots`, {
      params: { date, serviceId },
    });
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
