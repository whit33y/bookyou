import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { BusinessService } from '../../core/services/business.service';
import { Service } from '../../core/models/business.model';

@Component({
  selector: 'app-service-modal',
  imports: [ReactiveFormsModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-modal.html',
})
export class ServiceModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);

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
}
