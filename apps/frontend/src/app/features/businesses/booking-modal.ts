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
  templateUrl: './booking-modal.html',
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
  readonly bookedSlots = signal<string[]>([]);

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
    this.bookedSlots.set([]);

    if (value) {
      this.appointmentService
        .getBookedSlots(this.business().ownerId, value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (slots) => this.bookedSlots.set(slots),
          error: () => this.bookedSlots.set([]),
        });
    }
  }

  selectTime(slot: string) {
    this.selectedTime.set(slot);
  }

  isSlotBooked(slot: string): boolean {
    return this.bookedSlots().includes(slot);
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
