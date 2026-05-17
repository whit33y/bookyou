import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BusinessService } from '../../core/services/business.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentStatus } from '../../core/models/appointment.model';
import { Service } from '../../core/models/business.model';
import { BusinessSettingsComponent } from './business-settings';
import { ServiceModalComponent } from './service-modal';

@Component({
  selector: 'app-dashboard',
  imports: [BusinessSettingsComponent, ServiceModalComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900">Panel usługodawcy</h1>

      @if (businessService.loading()) {
        <p class="mt-4 text-gray-600">Ładowanie...</p>
      } @else {
        <div class="mt-8 space-y-8">
          @if (businessService.business()) {
            <section
              class="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
              aria-label="Oczekujące wizyty"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-yellow-800">Oczekujące wizyty</h2>
                  <p class="mt-1 text-sm text-yellow-700">
                    @if (pendingCount() > 0) {
                      Masz {{ pendingCount() }}
                      {{ pendingCount() === 1 ? 'wizytę oczekującą' : 'wizyt oczekujących' }}
                      na potwierdzenie.
                    } @else {
                      Brak wizyt oczekujących na potwierdzenie.
                    }
                  </p>
                </div>
                <a
                  routerLink="/calendar"
                  class="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Przejdź do kalendarza
                </a>
              </div>
            </section>
          }

          <app-business-settings />

          <section>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Usługi</h2>
              @if (businessService.business()) {
                <button
                  (click)="openServiceModal()"
                  class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Dodaj usługę
                </button>
              }
            </div>

            @if (!businessService.business()) {
              <p class="mt-4 text-sm text-gray-500">
                Najpierw utwórz profil biznesowy, aby zarządzać usługami.
              </p>
            } @else if (businessService.services().length === 0) {
              <p class="mt-4 text-sm text-gray-500">Brak usług. Dodaj pierwszą usługę.</p>
            } @else {
              <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Nazwa
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Czas trwania
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Cena
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (service of businessService.services(); track service.id) {
                      <tr>
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {{ service.name }}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {{ service.duration }} min
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {{ service.price }} zł
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <button
                            (click)="openServiceModal(service)"
                            class="font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Edytuj
                          </button>
                          <button
                            (click)="deleteService(service)"
                            class="ml-4 font-medium text-red-600 hover:text-red-500"
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        </div>
      }

      @if (showServiceModal()) {
        <app-service-modal
          [service]="editingService()"
          (closed)="closeServiceModal()"
          (saved)="closeServiceModal()"
        />
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly businessService = inject(BusinessService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showServiceModal = signal(false);
  readonly editingService = signal<Service | null>(null);
  readonly pendingCount = signal(0);

  ngOnInit() {
    this.businessService.loadMyBusiness();
    this.loadPendingCount();
  }

  openServiceModal(service?: Service) {
    this.editingService.set(service ?? null);
    this.showServiceModal.set(true);
  }

  closeServiceModal() {
    this.showServiceModal.set(false);
    this.editingService.set(null);
  }

  deleteService(service: Service) {
    if (!confirm(`Czy na pewno chcesz usunąć usługę "${service.name}"?`)) return;
    this.businessService.deleteService(service.id).subscribe({
      error: () => alert('Nie udało się usunąć usługi. Spróbuj ponownie.'),
    });
  }

  private loadPendingCount(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.appointmentService
      .getMyAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointments) => {
          const count = appointments.filter(
            (a) =>
              a.status === AppointmentStatus.PENDING &&
              (a.providerId === userId || a.business.ownerId === userId),
          ).length;
          this.pendingCount.set(count);
        },
      });
  }
}
