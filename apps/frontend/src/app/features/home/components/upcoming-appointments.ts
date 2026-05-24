import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-upcoming-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <section aria-labelledby="upcoming-appointments-heading">
      <h2 id="upcoming-appointments-heading" class="text-lg font-semibold text-gray-700 sm:text-xl">
        Nadchodzące wizyty
      </h2>

      @if (loading()) {
        <div class="mt-4 flex items-center justify-center py-8" aria-label="Ładowanie wizyt">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          ></div>
        </div>
      } @else if (appointments().length === 0) {
        <div
          class="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-8 text-center shadow-sm"
        >
          <p class="text-sm text-gray-500">Brak nadchodzących wizyt</p>
          <a
            routerLink="/businesses"
            class="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Zarezerwuj wizytę
          </a>
        </div>
      } @else {
        <ul class="mt-4 space-y-3">
          @for (appointment of appointments(); track appointment.id) {
            <li
              class="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4"
            >
              <div class="flex flex-col gap-1">
                <p class="text-sm font-medium text-gray-700">
                  {{ appointment.startTime | date: 'd MMMM yyyy' }}
                  · {{ appointment.startTime | date: 'HH:mm' }} –
                  {{ appointment.endTime | date: 'HH:mm' }}
                </p>
                <p class="text-sm text-gray-600">
                  {{ appointment.service.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ appointment.provider.name ?? 'Specjalista' }} · {{ appointment.business.name }}
                </p>
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class UpcomingAppointmentsComponent {
  readonly appointments = input.required<Appointment[]>();
  readonly loading = input.required<boolean>();
}
