import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DiscoveryService } from '../../core/services/discovery.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../core/models/business.model';
import { BookingModalComponent } from './booking-modal';

@Component({
  selector: 'app-business-details',
  imports: [BookingModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      @if (discoveryService.loading()) {
        <p class="text-gray-500">Ładowanie...</p>
      } @else if (discoveryService.selectedBusiness(); as business) {
        <div class="space-y-8">
          <section>
            <h1 class="text-2xl font-bold text-gray-900">{{ business.name }}</h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ business.street }}, {{ business.zipCode }} {{ business.city }}
            </p>
            @if (business.description) {
              <p class="mt-4 text-gray-700">{{ business.description }}</p>
            }
          </section>

          @if (business.openingHours) {
            <section>
              <h2 class="text-lg font-semibold text-gray-900">Godziny otwarcia</h2>
              <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                @for (day of weekDays; track day.key) {
                  <div>
                    <dt class="font-medium text-gray-700">{{ day.label }}</dt>
                    <dd class="text-gray-500">
                      @if (business.openingHours[day.key]; as hours) {
                        {{ hours.open }} - {{ hours.close }}
                      } @else {
                        Zamknięte
                      }
                    </dd>
                  </div>
                }
              </dl>
            </section>
          }

          <section>
            <h2 class="text-lg font-semibold text-gray-900">Usługi</h2>
            @if (business.services && business.services.length > 0) {
              <div class="mt-4 space-y-3">
                @for (service of business.services; track service.id) {
                  <div
                    class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p class="font-medium text-gray-900">{{ service.name }}</p>
                      <p class="text-sm text-gray-500">
                        {{ service.duration }} min · {{ service.price }} zł
                      </p>
                    </div>
                    @if (authService.isAuthenticated()) {
                      <button
                        (click)="openBooking(service)"
                        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Zarezerwuj
                      </button>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="mt-4 text-sm text-gray-500">Brak dostępnych usług.</p>
            }
          </section>
        </div>

        @if (showBookingModal()) {
          @let service = selectedService();
          @if (service) {
            <app-booking-modal
              [business]="business"
              [service]="service"
              (closed)="closeBooking()"
            />
          }
        }
      } @else {
        <p class="text-gray-500">Nie znaleziono firmy.</p>
      }
    </div>
  `,
})
export class BusinessDetailsComponent implements OnInit {
  protected readonly discoveryService = inject(DiscoveryService);
  protected readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly showBookingModal = signal(false);
  readonly selectedService = signal<Service | null>(null);

  readonly weekDays = [
    { key: 'monday' as const, label: 'Pon' },
    { key: 'tuesday' as const, label: 'Wt' },
    { key: 'wednesday' as const, label: 'Śr' },
    { key: 'thursday' as const, label: 'Czw' },
    { key: 'friday' as const, label: 'Pt' },
    { key: 'saturday' as const, label: 'Sob' },
    { key: 'sunday' as const, label: 'Ndz' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.discoveryService.loadBusiness(id);
    }
  }

  openBooking(service: Service) {
    this.selectedService.set(service);
    this.showBookingModal.set(true);
  }

  closeBooking() {
    this.showBookingModal.set(false);
    this.selectedService.set(null);
  }
}
