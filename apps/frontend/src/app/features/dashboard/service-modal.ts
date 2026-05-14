import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessService } from '../../core/services/business.service';
import { Service } from '../../core/models/business.model';

@Component({
  selector: 'app-service-modal',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      (click)="onBackdropClick($event)"
      (keydown.escape)="closed.emit()"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="service() ? 'Edytuj usługę' : 'Dodaj usługę'"
    >
      <div #modalPanel class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ service() ? 'Edytuj usługę' : 'Dodaj usługę' }}
        </h2>

        @if (error) {
          <p class="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
          <div>
            <label for="service-name" class="block text-sm font-medium text-gray-700">
              Nazwa
            </label>
            <input
              id="service-name"
              type="text"
              formControlName="name"
              [attr.aria-invalid]="
                form.controls.name.touched && form.controls.name.errors ? true : null
              "
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="service-duration" class="block text-sm font-medium text-gray-700">
              Czas trwania (min)
            </label>
            <input
              id="service-duration"
              type="number"
              formControlName="duration"
              [attr.aria-invalid]="
                form.controls.duration.touched && form.controls.duration.errors ? true : null
              "
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="service-price" class="block text-sm font-medium text-gray-700">
              Cena (zł)
            </label>
            <input
              id="service-price"
              type="number"
              step="0.01"
              formControlName="price"
              [attr.aria-invalid]="
                form.controls.price.touched && form.controls.price.errors ? true : null
              "
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closed.emit()"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ loading ? 'Zapisywanie...' : 'Zapisz' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ServiceModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);
  private readonly modalPanel = viewChild.required<ElementRef<HTMLElement>>('modalPanel');
  private previouslyFocused: HTMLElement | null = null;

  service = input<Service | null>(null);
  closed = output<void>();
  saved = output<void>();

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    duration: [30, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
  });

  loading = false;
  error = '';

  ngOnInit() {
    const s = this.service();
    if (s) {
      this.form.patchValue({ name: s.name, duration: s.duration, price: s.price });
    }
  }

  ngAfterViewInit() {
    this.previouslyFocused = document.activeElement as HTMLElement;
    const panel = this.modalPanel().nativeElement;
    const firstInput = panel.querySelector<HTMLElement>('input, button, textarea');
    firstInput?.focus();
    panel.addEventListener('keydown', this.trapFocus);
  }

  ngOnDestroy() {
    this.modalPanel().nativeElement.removeEventListener('keydown', this.trapFocus);
    this.previouslyFocused?.focus();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const data = this.form.getRawValue();
    const s = this.service();
    const businessId = this.businessService.businessId();

    if (!s && !businessId) {
      this.error = 'Nie można dodać usługi — brak profilu biznesowego.';
      this.loading = false;
      return;
    }

    const request$ = s
      ? this.businessService.updateService(s.id, data)
      : this.businessService.createService(businessId!, data);

    request$.subscribe({
      next: () => this.saved.emit(),
      error: () => {
        this.error = 'Nie udało się zapisać usługi. Spróbuj ponownie.';
        this.loading = false;
      },
    });
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  private trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const panel = this.modalPanel().nativeElement;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
