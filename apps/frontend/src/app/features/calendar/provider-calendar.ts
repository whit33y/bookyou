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
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';

type ViewMode = 'week' | 'day';

interface ParsedAppointment extends Appointment {
  parsedStart: Date;
}

interface DayColumn {
  dateKey: string;
  label: string;
  appointments: ParsedAppointment[];
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Oczekująca',
  [AppointmentStatus.CONFIRMED]: 'Potwierdzona',
  [AppointmentStatus.CANCELLED]: 'Anulowana',
  [AppointmentStatus.COMPLETED]: 'Zakończona',
  [AppointmentStatus.NOSHOW]: 'Nieobecność',
};

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]:
    'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800',
  [AppointmentStatus.CONFIRMED]:
    'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800',
  [AppointmentStatus.CANCELLED]:
    'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800',
  [AppointmentStatus.COMPLETED]:
    'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800',
  [AppointmentStatus.NOSHOW]:
    'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800',
};

const STATUS_CARD_CLASSES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'border-yellow-200 bg-yellow-50',
  [AppointmentStatus.CONFIRMED]: 'border-green-200 bg-green-50',
  [AppointmentStatus.CANCELLED]: 'border-red-200 bg-red-50',
  [AppointmentStatus.COMPLETED]: 'border-blue-200 bg-blue-50',
  [AppointmentStatus.NOSHOW]: 'border-gray-200 bg-gray-50',
};

@Component({
  selector: 'app-provider-calendar',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Kalendarz</h1>

        <div class="flex items-center gap-2">
          <button
            (click)="navigatePrev()"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Poprzedni okres"
          >
            ←
          </button>
          <button
            (click)="navigateToday()"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dziś
          </button>
          <button
            (click)="navigateNext()"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Następny okres"
          >
            →
          </button>

          <span class="ml-2 text-sm font-medium text-gray-700">
            {{ dateRangeLabel() }}
          </span>

          <div
            class="ml-4 flex rounded-md border border-gray-300"
            role="group"
            aria-label="Widok kalendarza"
          >
            <button
              (click)="setView('day')"
              [class]="dayBtnClass()"
              [attr.aria-pressed]="viewMode() === 'day'"
            >
              Dzień
            </button>
            <button
              (click)="setView('week')"
              [class]="weekBtnClass()"
              [attr.aria-pressed]="viewMode() === 'week'"
            >
              Tydzień
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <p class="mt-8 text-center text-gray-500" aria-live="polite">Ładowanie...</p>
      } @else {
        <div class="mt-6 overflow-x-auto" role="grid" aria-label="Kalendarz wizyt">
          <div class="grid min-w-[600px]" [style.grid-template-columns]="gridCols()">
            @for (day of dayColumns(); track day.dateKey) {
              <div class="border-r border-gray-200 last:border-r-0" role="gridcell">
                <div
                  class="sticky top-0 border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  role="columnheader"
                >
                  {{ day.label }}
                </div>
                <div class="space-y-2 p-2">
                  @for (appointment of day.appointments; track appointment.id) {
                    <div
                      class="rounded-lg border p-3"
                      [class]="appointmentCardClass(appointment.status)"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-gray-900">
                            {{ appointment.service.name }}
                          </p>
                          <p class="text-xs text-gray-600">
                            {{ appointment.startTime | date: 'HH:mm' }} –
                            {{ appointment.endTime | date: 'HH:mm' }}
                          </p>
                          <p class="mt-1 truncate text-xs text-gray-500">
                            {{ appointment.client.name ?? appointment.client.email }}
                          </p>
                        </div>
                        <span [class]="statusBadgeClass(appointment.status)">
                          {{ statusLabel(appointment.status) }}
                        </span>
                      </div>

                      @if (canUpdateStatus(appointment)) {
                        <div class="mt-2 flex gap-2">
                          @if (appointment.status === pendingStatus) {
                            <button
                              (click)="confirmAppointment(appointment)"
                              class="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Potwierdź
                            </button>
                          }
                          <button
                            (click)="cancelAppointment(appointment)"
                            class="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Anuluj
                          </button>
                        </div>
                      }
                    </div>
                  } @empty {
                    <p class="py-4 text-center text-xs text-gray-400">Brak wizyt</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ProviderCalendarComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingStatus = AppointmentStatus.PENDING;

  readonly viewMode = signal<ViewMode>('week');
  readonly currentDate = signal(new Date());
  readonly allAppointments = signal<ParsedAppointment[]>([]);
  readonly loading = signal(false);

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
        error: () => alert('Nie udało się potwierdzić wizyty.'),
      });
  }

  cancelAppointment(appointment: Appointment): void {
    if (!confirm('Czy na pewno chcesz anulować tę wizytę?')) return;
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CANCELLED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadAppointments(),
        error: () => alert('Nie udało się anulować wizyty.'),
      });
  }

  statusLabel(status: AppointmentStatus): string {
    return STATUS_LABELS[status];
  }

  statusBadgeClass(status: AppointmentStatus): string {
    return STATUS_BADGE_CLASSES[status];
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
