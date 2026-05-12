import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div class="w-full max-w-md space-y-6">
        <h1 class="text-center text-2xl font-bold text-gray-900">Rejestracja</h1>

        @if (error) {
          <p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Imię</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

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
              <p class="mt-1 text-sm text-red-600">Hasło musi mieć minimum 8 znaków.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ loading ? 'Rejestracja...' : 'Zarejestruj się' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-600">
          Masz już konto?
          <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Zaloguj się
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = 'Rejestracja nie powiodła się. Spróbuj ponownie.';
        this.loading = false;
      },
    });
  }
}
