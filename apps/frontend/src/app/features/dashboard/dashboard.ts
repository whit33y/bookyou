import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { BusinessService } from '../../core/services/business.service';
import { Service } from '../../core/models/business.model';
import { BusinessSettingsComponent } from './business-settings';
import { ServiceModalComponent } from './service-modal';

@Component({
  selector: 'app-dashboard',
  imports: [BusinessSettingsComponent, ServiceModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900">Panel usługodawcy</h1>

      @if (businessService.loading()) {
        <p class="mt-4 text-gray-600">Ładowanie...</p>
      } @else {
        <div class="mt-8 space-y-8">
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

  showServiceModal = signal(false);
  editingService = signal<Service | null>(null);

  ngOnInit() {
    this.businessService.loadMyBusiness();
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
}
