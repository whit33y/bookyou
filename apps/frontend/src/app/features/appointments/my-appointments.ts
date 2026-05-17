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
import { AppointmentStatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-my-appointments',
  imports: [DatePipe, AppointmentStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-appointments.html',
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

  private isTerminal(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.NOSHOW
    );
  }
}
