import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(false);

  loadMyAppointments() {
    this.loading.set(true);
    this.http.get<Appointment[]>(`${this.apiUrl}/my`).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(data: CreateAppointmentRequest) {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  updateStatus(id: string, status: AppointmentStatus) {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, { status });
  }
}
