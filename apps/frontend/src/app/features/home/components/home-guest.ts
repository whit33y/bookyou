import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HeroSectionComponent } from './hero-section';
import { HowItWorksComponent } from './how-it-works';

@Component({
  selector: 'app-home-guest',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroSectionComponent, HowItWorksComponent],
  template: `
    <div class="flex flex-col">
      <app-hero-section />
      <app-how-it-works />
    </div>
  `,
})
export class HomeGuestComponent {}
