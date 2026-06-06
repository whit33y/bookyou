import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { Role } from '../../core/models/user.model';
import { canCancelAppointment } from '../../core/utils/appointment.utils';
import { AppointmentStatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { ReviewModalComponent } from '../reviews/review-modal';
import { AppointmentReview } from '../../core/models/appointment.model';

@Component({
  selector: 'app-my-appointments',
  imports: [
    DatePipe,
    AppointmentStatusBadgeComponent,
    ConfirmModalComponent,
    StarRatingComponent,
    ReviewModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-appointments.html',
})
export class MyAppointmentsComponent implements OnInit {
  protected readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notify = inject(NotificationService);

  readonly appointmentToCancel = signal<Appointment | null>(null);
  readonly appointmentToReview = signal<Appointment | null>(null);
  readonly isProvider = computed(() => this.authService.currentUser()?.role === Role.PROVIDER);
  protected readonly pendingStatus = AppointmentStatus.PENDING;

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
    return canCancelAppointment(appointment);
  }

  canConfirm(appointment: Appointment): boolean {
    return this.isProvider() && appointment.status === AppointmentStatus.PENDING;
  }

  canReview(appointment: Appointment): boolean {
    return (
      !this.isProvider() &&
      appointment.status === AppointmentStatus.COMPLETED &&
      !appointment.review
    );
  }

  requestReview(appointment: Appointment): void {
    this.appointmentToReview.set(appointment);
  }

  onReviewSubmitted(review: AppointmentReview): void {
    const reviewed = this.appointmentToReview();
    this.appointmentToReview.set(null);
    if (!reviewed) return;
    this.notify.success('Dziękujemy za opinię!');
    // Reflect the new review locally so the form can't be reopened.
    this.appointmentService.appointments.update((appointments) =>
      appointments.map((a) => (a.id === reviewed.id ? { ...a, review } : a)),
    );
  }

  dismissReview(): void {
    this.appointmentToReview.set(null);
  }

  confirmAppointment(appointment: Appointment): void {
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CONFIRMED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.appointmentService.loadMyAppointments(),
        error: () => this.notify.error('Nie udało się potwierdzić wizyty.'),
      });
  }

  requestCancel(appointment: Appointment): void {
    this.appointmentToCancel.set(appointment);
  }

  confirmCancel(): void {
    const appointment = this.appointmentToCancel();
    if (!appointment) return;
    this.appointmentToCancel.set(null);
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CANCELLED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.appointmentService.loadMyAppointments(),
        error: () => this.notify.error('Nie udało się anulować wizyty.'),
      });
  }

  dismissCancel(): void {
    this.appointmentToCancel.set(null);
  }

  private isTerminal(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.NOSHOW
    );
  }
}
