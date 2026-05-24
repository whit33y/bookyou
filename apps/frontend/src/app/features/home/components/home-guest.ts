import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HeroSectionComponent } from './hero-section';
import { HowItWorksComponent } from './how-it-works';
import { ServiceCategoriesComponent } from './service-categories';
import { SocialProofComponent } from './social-proof';

@Component({
  selector: 'app-home-guest',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroSectionComponent,
    HowItWorksComponent,
    ServiceCategoriesComponent,
    SocialProofComponent,
  ],
  template: `
    <div class="flex flex-col">
      <app-hero-section />
      <app-service-categories />
      <app-how-it-works />
      <app-social-proof />
    </div>
  `,
})
export class HomeGuestComponent {}
