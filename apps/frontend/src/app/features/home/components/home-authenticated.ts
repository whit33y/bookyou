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
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { Role } from '../../../core/models/user.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DiscoveryService } from '../../../core/services/discovery.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { RecommendationsComponent } from './recommendations';
import { UpcomingAppointmentsComponent } from './upcoming-appointments';
import { UrgentBannerComponent } from './urgent-banner';

@Component({
  selector: 'app-home-authenticated',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UrgentBannerComponent,
    UpcomingAppointmentsComponent,
    RecommendationsComponent,
    ConfirmModalComponent,
  ],
  template: `
    <div class="flex flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8">
      @if (urgentAppointment(); as urgent) {
        <app-urgent-banner [appointment]="urgent" [now]="now()" />
      }

      <app-upcoming-appointments
        [appointments]="upcomingAppointments()"
        [loading]="loading()"
        [showBookingLink]="!isProvider()"
        [isProvider]="isProvider()"
        (confirmed)="confirmAppointment($event)"
        (cancelRequested)="requestCancel($event)"
      />

      @if (!isProvider()) {
        <div class="flex justify-center">
          <a
            routerLink="/businesses"
            class="inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Zarezerwuj wizytę
          </a>
        </div>

        <app-recommendations [businesses]="recommendations()" />
      }
    </div>

    @if (appointmentToCancel()) {
      <app-confirm-modal
        title="Anulowanie wizyty"
        message="Czy na pewno chcesz anulować tę wizytę?"
        confirmLabel="Anuluj wizytę"
        cancelLabel="Wróć"
        (confirmed)="confirmCancel()"
        (cancelled)="dismissCancel()"
      />
    }
  `,
})
export class HomeAuthenticatedComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly discoveryService = inject(DiscoveryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly now = signal(new Date());
  readonly loading = this.appointmentService.loading;
  readonly recommendations = this.discoveryService.businesses;
  readonly isProvider = computed(() => this.authService.currentUser()?.role === Role.PROVIDER);
  readonly appointmentToCancel = signal<Appointment | null>(null);

  readonly upcomingAppointments = computed(() => {
    const now = this.now();
    return this.appointmentService
      .appointments()
      .filter(
        (a) =>
          (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.PENDING) &&
          new Date(a.startTime) > now,
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  readonly urgentAppointment = computed(() => {
    const now = this.now();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return this.upcomingAppointments().find((a) => new Date(a.startTime) <= in24h) ?? null;
  });

  ngOnInit(): void {
    this.appointmentService.loadMyAppointments();
    if (!this.isProvider()) {
      this.discoveryService.loadBusinesses();
    }
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(new Date()));
  }

  confirmAppointment(appointment: Appointment): void {
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CONFIRMED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.appointmentService.loadMyAppointments(),
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
      });
  }

  dismissCancel(): void {
    this.appointmentToCancel.set(null);
  }
}
