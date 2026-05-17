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
  templateUrl: './service-modal.html',
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
