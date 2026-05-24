import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-urgent-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'alert',
    'aria-live': 'polite',
  },
  template: `
    <div
      class="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 shadow-sm sm:px-6 sm:py-5"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span class="text-2xl" aria-hidden="true">⏰</span>
        <div class="flex flex-col gap-0.5">
          <p class="text-sm font-semibold text-amber-900">Nadchodząca wizyta {{ timeUntil() }}</p>
          <p class="text-sm text-amber-800">
            {{ appointment().service.name }} — {{ specialistName() }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class UrgentBannerComponent {
  readonly appointment = input.required<Appointment>();

  readonly specialistName = computed(() => {
    const name = this.appointment().provider.name;
    return name ?? 'Specjalista';
  });

  readonly timeUntil = computed(() => {
    const now = new Date();
    const start = new Date(this.appointment().startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'teraz';
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 60) {
      return `za ${diffMinutes} ${this.pluralizeMinutes(diffMinutes)}`;
    }

    const remainingMinutes = diffMinutes % 60;
    const hoursText = `za ${diffHours} ${this.pluralizeHours(diffHours)}`;

    if (remainingMinutes === 0) {
      return hoursText;
    }

    return `${hoursText} i ${remainingMinutes} ${this.pluralizeMinutes(remainingMinutes)}`;
  });

  private pluralizeHours(count: number): string {
    if (count === 1) return 'godzinę';
    if (count >= 2 && count <= 4) return 'godziny';
    return 'godzin';
  }

  private pluralizeMinutes(count: number): string {
    if (count === 1) return 'minutę';
    if (count >= 2 && count <= 4) return 'minuty';
    return 'minut';
  }
}
