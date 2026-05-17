import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  protected readonly businessService = inject(BusinessService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);

  readonly showServiceModal = signal(false);
  readonly editingService = signal<Service | null>(null);

  readonly pendingCount = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return 0;
    return this.appointmentService
      .appointments()
      .filter(
        (a) =>
          a.status === AppointmentStatus.PENDING &&
          (a.providerId === userId || a.business.ownerId === userId),
      ).length;
  });

  readonly pendingLabel = computed(() => {
    const n = this.pendingCount();
    const category = new Intl.PluralRules('pl-PL').select(n);
    const labels: Record<string, string> = {
      one: 'wizytę oczekującą',
      few: 'wizyty oczekujące',
      many: 'wizyt oczekujących',
    };
    return labels[category] ?? labels['many'];
  });

  ngOnInit() {
    this.businessService.loadMyBusiness();
    this.appointmentService.loadMyAppointments();
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
