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
import { AppointmentStatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal';

type ViewMode = 'week' | 'day';

interface ParsedAppointment extends Appointment {
  parsedStart: Date;
}

interface DayColumn {
  dateKey: string;
  label: string;
  appointments: ParsedAppointment[];
}

const STATUS_CARD_CLASSES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'border-yellow-200 bg-yellow-50',
  [AppointmentStatus.CONFIRMED]: 'border-green-200 bg-green-50',
  [AppointmentStatus.CANCELLED]: 'border-red-200 bg-red-50',
  [AppointmentStatus.COMPLETED]: 'border-blue-200 bg-blue-50',
  [AppointmentStatus.NOSHOW]: 'border-gray-200 bg-gray-50',
};

@Component({
  selector: 'app-provider-calendar',
  imports: [DatePipe, AppointmentStatusBadgeComponent, ConfirmModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-calendar.html',
})
export class ProviderCalendarComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingStatus = AppointmentStatus.PENDING;

  readonly viewMode = signal<ViewMode>('week');
  readonly currentDate = signal(new Date());
  readonly allAppointments = signal<ParsedAppointment[]>([]);
  readonly loading = signal(false);
  readonly appointmentToCancel = signal<Appointment | null>(null);

  private readonly providerAppointments = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    return this.allAppointments().filter(
      (a) => a.providerId === userId || a.business.ownerId === userId,
    );
  });

  readonly dateRange = computed(() => {
    const date = this.currentDate();
    if (this.viewMode() === 'day') {
      return { start: this.startOfDay(date), end: this.endOfDay(date) };
    }
    const start = this.startOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  });

  readonly dateRangeLabel = computed(() => {
    const { start, end } = this.dateRange();
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (this.viewMode() === 'day') {
      return start.toLocaleDateString('pl-PL', opts);
    }
    const endDisplay = new Date(end);
    endDisplay.setDate(endDisplay.getDate() - 1);
    return `${start.toLocaleDateString('pl-PL', opts)} – ${endDisplay.toLocaleDateString('pl-PL', opts)}`;
  });

  readonly dayColumns = computed<DayColumn[]>(() => {
    const { start, end } = this.dateRange();
    const days: DayColumn[] = [];
    const current = new Date(start);

    while (current < end) {
      const dateKey = this.toDateKey(current);
      const label = current.toLocaleDateString('pl-PL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const dayStart = this.startOfDay(current);
      const dayEnd = this.endOfDay(current);

      const appointments = this.providerAppointments().filter(
        (a) => a.parsedStart >= dayStart && a.parsedStart <= dayEnd,
      );

      days.push({ dateKey, label, appointments });
      current.setDate(current.getDate() + 1);
    }

    return days;
  });

  readonly gridCols = computed(() => {
    const count = this.dayColumns().length;
    return `repeat(${count}, minmax(180px, 1fr))`;
  });

  readonly dayBtnClass = computed(() => {
    const base = 'px-3 py-2 text-sm font-medium';
    return this.viewMode() === 'day'
      ? `${base} bg-indigo-600 text-white`
      : `${base} text-gray-700 hover:bg-gray-50`;
  });

  readonly weekBtnClass = computed(() => {
    const base = 'px-3 py-2 text-sm font-medium';
    return this.viewMode() === 'week'
      ? `${base} bg-indigo-600 text-white`
      : `${base} text-gray-700 hover:bg-gray-50`;
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  navigatePrev(): void {
    const date = new Date(this.currentDate());
    date.setDate(date.getDate() - (this.viewMode() === 'week' ? 7 : 1));
    this.currentDate.set(date);
  }

  navigateNext(): void {
    const date = new Date(this.currentDate());
    date.setDate(date.getDate() + (this.viewMode() === 'week' ? 7 : 1));
    this.currentDate.set(date);
  }

  navigateToday(): void {
    this.currentDate.set(new Date());
  }

  canUpdateStatus(appointment: Appointment): boolean {
    return (
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED
    );
  }

  confirmAppointment(appointment: Appointment): void {
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CONFIRMED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadAppointments(),
        error: () => this.notify.error('Nie udało się potwierdzić wizyty.'),
      });
  }

  requestCancelAppointment(appointment: Appointment): void {
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
        next: () => this.loadAppointments(),
        error: () => this.notify.error('Nie udało się anulować wizyty.'),
      });
  }

  dismissCancel(): void {
    this.appointmentToCancel.set(null);
  }

  appointmentCardClass(status: AppointmentStatus): string {
    return STATUS_CARD_CLASSES[status];
  }

  private loadAppointments(): void {
    this.loading.set(true);
    this.appointmentService
      .getMyAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allAppointments.set(data.map((a) => ({ ...a, parsedStart: new Date(a.startTime) })));
          this.loading.set(false);
        },
        error: () => {
          this.allAppointments.set([]);
          this.loading.set(false);
        },
      });
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
