import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { NotificationService } from '../../core/services/notification.service';
import { AppointmentStatus } from '../../core/models/appointment.model';
import { Service } from '../../core/models/business.model';
import { CategoryService } from '../../core/services/category.service';
import { BusinessSettingsComponent } from './business-settings';
import { ServiceModalComponent } from './service-modal';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-dashboard',
  imports: [
    BusinessSettingsComponent,
    ServiceModalComponent,
    ConfirmModalComponent,
    RouterLink,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  protected readonly businessService = inject(BusinessService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly categoryService = inject(CategoryService);

  readonly showServiceModal = signal(false);
  readonly editingService = signal<Service | null>(null);
  readonly serviceToDelete = signal<Service | null>(null);

  readonly deleteMessage = computed(() => {
    const service = this.serviceToDelete();
    return service ? `Czy na pewno chcesz usunąć usługę "${service.name}"?` : '';
  });

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
    this.categoryService.loadCategories();
  }

  readonly categoryMap = computed(
    () => new Map(this.categoryService.categories().map((c) => [c.id, c.name])),
  );

  categoryName(categoryId: string | null): string {
    if (!categoryId) return '—';
    return this.categoryMap().get(categoryId) ?? '—';
  }

  openServiceModal(service?: Service) {
    this.editingService.set(service ?? null);
    this.showServiceModal.set(true);
  }

  closeServiceModal() {
    this.showServiceModal.set(false);
    this.editingService.set(null);
  }

  requestDeleteService(service: Service): void {
    this.serviceToDelete.set(service);
  }

  confirmDeleteService(): void {
    const service = this.serviceToDelete();
    if (!service) return;
    this.serviceToDelete.set(null);
    this.businessService
      .deleteService(service.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.businessService.loadMyBusiness(),
        error: () => this.notify.error('Nie udało się usunąć usługi.'),
      });
  }

  dismissDeleteService(): void {
    this.serviceToDelete.set(null);
  }
}
