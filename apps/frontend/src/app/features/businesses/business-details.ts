import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DiscoveryService } from '../../core/services/discovery.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../core/models/business.model';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { BookingModalComponent } from './booking-modal';
import { BusinessReviewsComponent } from './business-reviews';

@Component({
  selector: 'app-business-details',
  imports: [
    BookingModalComponent,
    BusinessReviewsComponent,
    StarRatingComponent,
    MediaUrlPipe,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './business-details.html',
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
