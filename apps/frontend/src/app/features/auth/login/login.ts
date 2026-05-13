import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div class="w-full max-w-md space-y-6">
        <h1 class="text-center text-2xl font-bold text-gray-900">Zaloguj się</h1>

        @if (error) {
          <p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            @if (form.controls.email.touched && form.controls.email.errors) {
              <p class="mt-1 text-sm text-red-600">Podaj prawidłowy adres email.</p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Hasło</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            @if (form.controls.password.touched && form.controls.password.errors) {
              <p class="mt-1 text-sm text-red-600">Hasło jest wymagane.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-600">
          Nie masz konta?
          <a routerLink="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            Zarejestruj się
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = 'Nieprawidłowy email lub hasło.';
        this.loading = false;
      },
    });
  }
}
