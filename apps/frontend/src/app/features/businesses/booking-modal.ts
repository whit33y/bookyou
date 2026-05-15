import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { Business, OpeningHours, Service } from '../../core/models/business.model';
import { AppointmentService } from '../../core/services/appointment.service';

const SLOT_INTERVAL_MINUTES = 30;

@Component({
  selector: 'app-booking-modal',
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" cdkTrapFocus>
        <div class="flex items-center justify-between">
          <h2 id="booking-modal-title" class="text-lg font-semibold text-gray-900">Rezerwacja</h2>
          <button
            (click)="closed.emit()"
            class="text-gray-400 hover:text-gray-600"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        <p class="mt-2 text-sm text-gray-600">
          {{ service().name }} · {{ service().duration }} min · {{ service().price }} zł
        </p>

        @if (step() === 'date') {
          <div class="mt-4">
            <label for="booking-date" class="block text-sm font-medium text-gray-700">
              Wybierz datę
            </label>
            <input
              id="booking-date"
              type="date"
              [min]="minDate"
              [value]="selectedDate()"
              (change)="onDateChange($event)"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            @if (selectedDate() && availableSlots().length === 0) {
              <p class="mt-2 text-sm text-red-500">Brak dostępnych godzin w tym dniu.</p>
            }
          </div>
        }

        @if (step() === 'time') {
          <div class="mt-4">
            <p class="text-sm font-medium text-gray-700">{{ selectedDate() }} — wybierz godzinę</p>
            <div class="mt-3 grid grid-cols-3 gap-2">
              @for (slot of availableSlots(); track slot) {
                <button
                  (click)="selectTime(slot)"
                  [class.bg-indigo-600]="selectedTime() === slot"
                  [class.text-white]="selectedTime() === slot"
                  [class.border-indigo-600]="selectedTime() === slot"
                  class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:border-indigo-400"
                >
                  {{ slot }}
                </button>
              }
            </div>
          </div>
        }

        @if (step() === 'confirm') {
          <div class="mt-4 space-y-2 rounded-md bg-gray-50 p-4 text-sm">
            <p><span class="font-medium">Data:</span> {{ selectedDate() }}</p>
            <p><span class="font-medium">Godzina:</span> {{ selectedTime() }}</p>
            <p><span class="font-medium">Usługa:</span> {{ service().name }}</p>
            <p><span class="font-medium">Czas trwania:</span> {{ service().duration }} min</p>
            <p><span class="font-medium">Cena:</span> {{ service().price }} zł</p>
          </div>
        }

        @if (errorMessage()) {
          <p class="mt-3 text-sm text-red-600">{{ errorMessage() }}</p>
        }

        <div class="mt-6 flex justify-end gap-3">
          @if (step() !== 'date') {
            <button
              (click)="goBack()"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Wstecz
            </button>
          }
          @if (step() === 'date') {
            <button
              (click)="goToTime()"
              [disabled]="!selectedDate() || availableSlots().length === 0"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Dalej
            </button>
          } @else if (step() === 'time') {
            <button
              (click)="goToConfirm()"
              [disabled]="!selectedTime()"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Dalej
            </button>
          } @else {
            <button
              (click)="confirmBooking()"
              [disabled]="submitting()"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ submitting() ? 'Rezerwuję...' : 'Potwierdź rezerwację' }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class BookingModalComponent {
  readonly business = input.required<Business>();
  readonly service = input.required<Service>();
  readonly closed = output<void>();

  private readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<'date' | 'time' | 'confirm'>('date');
  readonly selectedDate = signal('');
  readonly selectedTime = signal('');
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly minDate = this.formatDate(new Date());

  readonly availableSlots = computed(() => {
    const date = this.selectedDate();
    if (!date) return [];
    return this.generateSlots(date);
  });

  onDateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.selectedTime.set('');
    this.errorMessage.set('');
  }

  selectTime(slot: string) {
    this.selectedTime.set(slot);
  }

  goToTime() {
    this.step.set('time');
  }

  goToConfirm() {
    this.step.set('confirm');
  }

  goBack() {
    const current = this.step();
    if (current === 'confirm') {
      this.step.set('time');
    } else if (current === 'time') {
      this.step.set('date');
    }
  }

  confirmBooking() {
    this.submitting.set(true);
    this.errorMessage.set('');

    const startTime = `${this.selectedDate()}T${this.selectedTime()}:00`;

    this.appointmentService
      .create({
        startTime,
        serviceId: this.service().id,
        businessId: this.business().id,
        providerId: this.business().ownerId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closed.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          const message = err?.error?.message ?? 'Nie udało się zarezerwować. Spróbuj ponownie.';
          this.errorMessage.set(message);
        },
      });
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  private generateSlots(dateStr: string): string[] {
    const openingHours = this.business().openingHours;
    if (!openingHours) return [];

    const dayOfWeek = this.getDayOfWeek(dateStr);
    const dayHours = (openingHours as OpeningHours)[dayOfWeek];
    if (!dayHours) return [];

    const slots: string[] = [];
    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const duration = this.service().duration;

    const now = new Date();
    const isToday = this.formatDate(now) === dateStr;

    for (let m = openMinutes; m + duration <= closeMinutes; m += SLOT_INTERVAL_MINUTES) {
      if (isToday) {
        const slotDate = new Date(`${dateStr}T${this.minutesToTime(m)}:00`);
        if (slotDate <= now) continue;
      }
      slots.push(this.minutesToTime(m));
    }

    return slots;
  }

  private getDayOfWeek(dateStr: string): keyof OpeningHours {
    const days: (keyof OpeningHours)[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayIndex = new Date(dateStr).getDay();
    return days[dayIndex];
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
