import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  private readonly loadTrigger = new Subject<void>();

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(false);

  constructor() {
    this.loadTrigger
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          return this.http.get<Appointment[]>(`${this.apiUrl}/my`);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.appointments.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.appointments.set([]);
          this.loading.set(false);
        },
      });
  }

  loadMyAppointments(): void {
    this.loadTrigger.next();
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/my`);
  }

  create(data: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  updateStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, { status });
  }
}
