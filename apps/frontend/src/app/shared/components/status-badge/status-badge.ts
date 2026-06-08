import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppointmentStatus } from '../../../core/models/appointment.model';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Oczekująca',
  [AppointmentStatus.CONFIRMED]: 'Potwierdzona',
  [AppointmentStatus.CANCELLED]: 'Anulowana',
  [AppointmentStatus.COMPLETED]: 'Zakończona',
  [AppointmentStatus.NOSHOW]: 'Nieobecność',
};

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300',
  [AppointmentStatus.CONFIRMED]:
    'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  [AppointmentStatus.COMPLETED]: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  [AppointmentStatus.NOSHOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()">{{ label() }}</span>`,
})
export class AppointmentStatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();

  readonly label = computed(() => STATUS_LABELS[this.status()]);
  readonly classes = computed(
    () =>
      `inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[this.status()]}`,
  );
}
