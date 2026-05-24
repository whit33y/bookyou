import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { HomeAuthenticatedComponent } from './components/home-authenticated';
import { HomeGuestComponent } from './components/home-guest';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeGuestComponent, HomeAuthenticatedComponent],
  template: `
    @if (currentUser()) {
      <app-home-authenticated />
    } @else {
      <app-home-guest />
    }
  `,
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
}
