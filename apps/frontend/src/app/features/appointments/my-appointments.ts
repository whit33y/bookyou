import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';

@Component({
  selector: 'app-my-appointments',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900">Moje wizyty</h1>

      @if (appointmentService.loading()) {
        <p class="mt-8 text-center text-gray-500">Ładowanie...</p>
      } @else if (appointmentService.appointments().length === 0) {
        <p class="mt-8 text-center text-gray-500">Nie masz jeszcze żadnych wizyt.</p>
      } @else {
        @if (upcoming().length > 0) {
          <section class="mt-8">
            <h2 class="text-lg font-semibold text-gray-900">Nadchodzące</h2>
            <div class="mt-4 space-y-4">
              @for (appointment of upcoming(); track appointment.id) {
                <div class="rounded-lg border border-gray-200 p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ appointment.service.name }}</p>
                      <p class="text-sm text-gray-600">{{ appointment.business.name }}</p>
                      <p class="mt-1 text-sm text-gray-500">
                        {{ appointment.startTime | date: 'd MMM yyyy, HH:mm' }}
                        · {{ appointment.service.duration }} min
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <span [class]="statusClass(appointment.status)">
                        {{ statusLabel(appointment.status) }}
                      </span>
                      @if (canCancel(appointment)) {
                        <button
                          (click)="cancel(appointment)"
                          class="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Anuluj
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        @if (past().length > 0) {
          <section class="mt-8">
            <h2 class="text-lg font-semibold text-gray-900">Historia</h2>
            <div class="mt-4 space-y-4">
              @for (appointment of past(); track appointment.id) {
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ appointment.service.name }}</p>
                      <p class="text-sm text-gray-600">{{ appointment.business.name }}</p>
                      <p class="mt-1 text-sm text-gray-500">
                        {{ appointment.startTime | date: 'd MMM yyyy, HH:mm' }}
                        · {{ appointment.service.duration }} min
                      </p>
                    </div>
                    <span [class]="statusClass(appointment.status)">
                      {{ statusLabel(appointment.status) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class MyAppointmentsComponent implements OnInit {
  protected readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly upcoming = computed(() =>
    this.appointmentService
      .appointments()
      .filter((a) => new Date(a.endTime) >= new Date() && !this.isTerminal(a.status)),
  );

  readonly past = computed(() =>
    this.appointmentService
      .appointments()
      .filter((a) => new Date(a.endTime) < new Date() || this.isTerminal(a.status)),
  );

  ngOnInit() {
    this.appointmentService.loadMyAppointments();
  }

  canCancel(appointment: Appointment): boolean {
    return (
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED
    );
  }

  cancel(appointment: Appointment) {
    if (!confirm('Czy na pewno chcesz anulować tę wizytę?')) return;
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CANCELLED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.appointmentService.loadMyAppointments(),
        error: () => alert('Nie udało się anulować wizyty.'),
      });
  }

  statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'Oczekująca',
      [AppointmentStatus.CONFIRMED]: 'Potwierdzona',
      [AppointmentStatus.CANCELLED]: 'Anulowana',
      [AppointmentStatus.COMPLETED]: 'Zakończona',
      [AppointmentStatus.NOSHOW]: 'Nieobecność',
    };
    return labels[status];
  }

  statusClass(status: AppointmentStatus): string {
    const base = 'inline-block rounded-full px-2 py-1 text-xs font-medium';
    const variants: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: `${base} bg-yellow-100 text-yellow-800`,
      [AppointmentStatus.CONFIRMED]: `${base} bg-green-100 text-green-800`,
      [AppointmentStatus.CANCELLED]: `${base} bg-red-100 text-red-800`,
      [AppointmentStatus.COMPLETED]: `${base} bg-blue-100 text-blue-800`,
      [AppointmentStatus.NOSHOW]: `${base} bg-gray-100 text-gray-800`,
    };
    return variants[status];
  }

  private isTerminal(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.NOSHOW
    );
  }
}
