import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <a routerLink="/" class="text-xl font-bold text-indigo-600">BookYou</a>

          <div class="flex items-center gap-4">
            @if (authService.currentUser()) {
              <span class="text-sm text-gray-700">{{ authService.currentUser()?.email }}</span>
              <button
                (click)="authService.logout()"
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Wyloguj
              </button>
            } @else {
              <a
                routerLink="/login"
                class="text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                Logowanie
              </a>
              <a
                routerLink="/register"
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Rejestracja
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavigationComponent {
  protected authService = inject(AuthService);
}
