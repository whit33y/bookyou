import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { EMPTY, Subject, switchMap } from 'rxjs';
import { Business, Service } from '../../core/models/business.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { BusinessService } from '../../core/services/business.service';

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
  private readonly businessService = inject(BusinessService);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<'date' | 'time' | 'confirm'>('date');
  readonly selectedDate = signal('');
  readonly selectedTime = signal('');
  readonly submitting = signal(false);
  readonly loadingSlots = signal(false);
  readonly errorMessage = signal('');
  readonly availableSlots = signal<string[]>([]);

  private readonly dateChange$ = new Subject<string>();

  readonly minDate = this.formatDate(new Date());

  constructor() {
    this.dateChange$
      .pipe(
        switchMap((date) => {
          if (!date) {
            this.availableSlots.set([]);
            return EMPTY;
          }
          this.loadingSlots.set(true);
          return this.businessService.getAvailableSlots(
            this.business().id,
            date,
            this.service().id,
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (slots) => {
          this.availableSlots.set(slots);
          this.loadingSlots.set(false);
        },
        error: () => {
          this.availableSlots.set([]);
          this.loadingSlots.set(false);
        },
      });
  }

  onDateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.selectedTime.set('');
    this.errorMessage.set('');
    this.availableSlots.set([]);
    this.dateChange$.next(value);
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
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          const message =
            err?.error?.message ?? 'Nie udało się zarezerwować. Spróbuj ponownie.';
          this.errorMessage.set(message);
        },
      });
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
