import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/user.model';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation.html',
})
export class NavigationComponent {
  protected authService = inject(AuthService);
  protected readonly providerRole = Role.PROVIDER;
  protected readonly clientRole = Role.CLIENT;
}
