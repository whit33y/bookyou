import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessService } from '../../core/services/business.service';

@Component({
  selector: 'app-business-settings',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2 class="text-xl font-semibold text-gray-900">Ustawienia biznesu</h2>

      @if (error) {
        <p class="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>
      }

      @if (success) {
        <p class="mt-2 rounded-md bg-green-50 p-3 text-sm text-green-600">{{ success }}</p>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2">
          <label for="biz-name" class="block text-sm font-medium text-gray-700">Nazwa firmy</label>
          <input
            id="biz-name"
            type="text"
            formControlName="name"
            [attr.aria-invalid]="
              form.controls.name.touched && form.controls.name.errors ? true : null
            "
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div class="sm:col-span-2">
          <label for="biz-description" class="block text-sm font-medium text-gray-700">
            Opis
          </label>
          <textarea
            id="biz-description"
            formControlName="description"
            rows="3"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div>
          <label for="biz-street" class="block text-sm font-medium text-gray-700">Ulica</label>
          <input
            id="biz-street"
            type="text"
            formControlName="street"
            [attr.aria-invalid]="
              form.controls.street.touched && form.controls.street.errors ? true : null
            "
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="biz-city" class="block text-sm font-medium text-gray-700">Miasto</label>
          <input
            id="biz-city"
            type="text"
            formControlName="city"
            [attr.aria-invalid]="
              form.controls.city.touched && form.controls.city.errors ? true : null
            "
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="biz-zip" class="block text-sm font-medium text-gray-700">
            Kod pocztowy
          </label>
          <input
            id="biz-zip"
            type="text"
            formControlName="zipCode"
            [attr.aria-invalid]="
              form.controls.zipCode.touched && form.controls.zipCode.errors ? true : null
            "
            aria-describedby="zip-error"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          @if (form.controls.zipCode.touched && form.controls.zipCode.errors) {
            <p id="zip-error" class="mt-1 text-sm text-red-600">Podaj kod w formacie XX-XXX.</p>
          }
        </div>

        <div>
          <label for="biz-country" class="block text-sm font-medium text-gray-700">Kraj</label>
          <input
            id="biz-country"
            type="text"
            formControlName="country"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div class="sm:col-span-2">
          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{
              loading
                ? 'Zapisywanie...'
                : businessService.business()
                  ? 'Zaktualizuj'
                  : 'Utwórz profil'
            }}
          </button>
        </div>
      </form>
    </section>
  `,
})
export class BusinessSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly businessService = inject(BusinessService);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    street: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{3}$/)]],
    country: ['Poland'],
  });

  loading = false;
  error = '';
  success = '';

  ngOnInit() {
    const b = this.businessService.business();
    if (b) {
      this.form.patchValue({
        name: b.name,
        description: b.description ?? '',
        street: b.street,
        city: b.city,
        zipCode: b.zipCode,
        country: b.country,
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    const data = this.form.getRawValue();
    const businessId = this.businessService.businessId();

    const request$ = businessId
      ? this.businessService.update(businessId, data)
      : this.businessService.create(data);

    request$.subscribe({
      next: () => {
        this.success = businessId ? 'Profil zaktualizowany.' : 'Profil utworzony.';
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udało się zapisać profilu. Spróbuj ponownie.';
        this.loading = false;
      },
    });
  }
}
