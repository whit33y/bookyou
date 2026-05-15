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

interface DayColumn {
  dateKey: string;
  label: string;
  appointments: Appointment[];
}

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

          <div class="ml-4 flex rounded-md border border-gray-300">
            <button (click)="setView('day')" [class]="viewBtnClass('day')">Dzień</button>
            <button (click)="setView('week')" [class]="viewBtnClass('week')">Tydzień</button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <p class="mt-8 text-center text-gray-500">Ładowanie...</p>
      } @else {
        <div class="mt-6 overflow-x-auto">
          <div class="grid min-w-[600px]" [style.grid-template-columns]="gridCols()">
            @for (day of dayColumns(); track day.dateKey) {
              <div class="border-r border-gray-200 last:border-r-0">
                <div
                  class="sticky top-0 border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700"
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
  readonly allAppointments = signal<Appointment[]>([]);
  readonly loading = signal(false);

  private readonly providerAppointments = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    return this.allAppointments().filter((a) => a.providerId === userId);
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

      const appointments = this.providerAppointments().filter((a) => {
        const aStart = new Date(a.startTime);
        return aStart >= dayStart && aStart <= dayEnd;
      });

      days.push({ dateKey, label, appointments });
      current.setDate(current.getDate() + 1);
    }

    return days;
  });

  readonly gridCols = computed(() => {
    const count = this.dayColumns().length;
    return `repeat(${count}, minmax(180px, 1fr))`;
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
      .subscribe({ next: () => this.loadAppointments() });
  }

  cancelAppointment(appointment: Appointment): void {
    if (!confirm('Czy na pewno chcesz anulować tę wizytę?')) return;
    this.appointmentService
      .updateStatus(appointment.id, AppointmentStatus.CANCELLED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadAppointments() });
  }

  viewBtnClass(mode: ViewMode): string {
    const base = 'px-3 py-2 text-sm font-medium';
    return this.viewMode() === mode
      ? `${base} bg-indigo-600 text-white`
      : `${base} text-gray-700 hover:bg-gray-50`;
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

  statusBadgeClass(status: AppointmentStatus): string {
    const base = 'inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium';
    const variants: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: `${base} bg-yellow-100 text-yellow-800`,
      [AppointmentStatus.CONFIRMED]: `${base} bg-green-100 text-green-800`,
      [AppointmentStatus.CANCELLED]: `${base} bg-red-100 text-red-800`,
      [AppointmentStatus.COMPLETED]: `${base} bg-blue-100 text-blue-800`,
      [AppointmentStatus.NOSHOW]: `${base} bg-gray-100 text-gray-800`,
    };
    return variants[status];
  }

  appointmentCardClass(status: AppointmentStatus): string {
    const variants: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'border-yellow-200 bg-yellow-50',
      [AppointmentStatus.CONFIRMED]: 'border-green-200 bg-green-50',
      [AppointmentStatus.CANCELLED]: 'border-red-200 bg-red-50',
      [AppointmentStatus.COMPLETED]: 'border-blue-200 bg-blue-50',
      [AppointmentStatus.NOSHOW]: 'border-gray-200 bg-gray-50',
    };
    return variants[status];
  }

  private loadAppointments(): void {
    this.loading.set(true);
    this.appointmentService
      .getMyAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allAppointments.set(data);
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
