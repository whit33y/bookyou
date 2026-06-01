import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BusinessService } from '../../core/services/business.service';
import { UploadService } from '../../core/services/upload.service';
import { OpeningHours, OpeningHoursDay } from '../../core/models/business.model';
import { NotificationService } from '../../core/services/notification.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload';
import { DayKey, WEEKDAYS } from '../../core/constants/weekdays';

interface DayFormControls {
  enabled: FormControl<boolean>;
  open: FormControl<string>;
  close: FormControl<string>;
}

function closeAfterOpenValidator(group: AbstractControl): ValidationErrors | null {
  const open = group.get('open')?.value as string | undefined;
  const close = group.get('close')?.value as string | undefined;
  if (!open || !close) {
    return null;
  }
  return close > open ? null : { closeBeforeOpen: true };
}

@Component({
  selector: 'app-business-settings',
  imports: [ReactiveFormsModule, ImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './business-settings.html',
})
export class BusinessSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadService = inject(UploadService);
  private readonly notifications = inject(NotificationService);
  protected readonly businessService = inject(BusinessService);
  protected readonly weekdays = WEEKDAYS;

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly logoUploading = signal(false);
  protected readonly coverUploading = signal(false);

  protected readonly logoUrl = computed(() =>
    this.uploadService.resolveUrl(this.businessService.business()?.logoUrl),
  );

  protected readonly coverUrl = computed(() =>
    this.uploadService.resolveUrl(this.businessService.business()?.coverUrl),
  );

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    street: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{3}$/)]],
    country: ['Poland'],
    email: ['', Validators.email],
    phone: ['', Validators.pattern(/^$|^\+?[0-9\s\-()]{7,20}$/)],
    website: [
      '',
      Validators.pattern(
        /^$|^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/\w\-.~:?#[\]@!$&'()*+,;=]*)$/,
      ),
    ],
    openingHours: this.buildOpeningHoursGroup(),
  });

  constructor() {
    this.registerDayToggleListeners();

    effect(() => {
      const b = this.businessService.business();
      if (b) {
        this.form.patchValue({
          name: b.name,
          description: b.description ?? '',
          street: b.street,
          city: b.city,
          zipCode: b.zipCode,
          country: b.country,
          email: b.email ?? '',
          phone: b.phone ?? '',
          website: b.website ?? '',
        });
        this.patchOpeningHours(b.openingHours);
      }
    });
  }

  protected getDayGroup(key: DayKey): FormGroup<DayFormControls> {
    return this.form.controls.openingHours.controls[key];
  }

  onLogoSelected(file: File): void {
    this.logoUploading.set(true);
    this.businessService.uploadLogo(file).subscribe({
      next: () => {
        this.notifications.success('Logo zostało zaktualizowane.');
        this.logoUploading.set(false);
      },
      error: () => {
        this.notifications.error('Nie udało się przesłać logo.');
        this.logoUploading.set(false);
      },
    });
  }

  onCoverSelected(file: File): void {
    this.coverUploading.set(true);
    this.businessService.uploadCover(file).subscribe({
      next: () => {
        this.notifications.success('Zdjęcie okładkowe zostało zaktualizowane.');
        this.coverUploading.set(false);
      },
      error: () => {
        this.notifications.error('Nie udało się przesłać zdjęcia okładkowego.');
        this.coverUploading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const formValue = this.form.getRawValue();
    const openingHours = this.collectOpeningHours();
    const data = {
      name: formValue.name,
      description: formValue.description,
      street: formValue.street,
      city: formValue.city,
      zipCode: formValue.zipCode,
      country: formValue.country,
      email: formValue.email || null,
      phone: formValue.phone || null,
      website: formValue.website || null,
      openingHours,
    };
    const businessId = this.businessService.businessId();

    const request$ = businessId
      ? this.businessService.update(businessId, data)
      : this.businessService.create(data);

    request$.subscribe({
      next: () => {
        this.success.set(businessId ? 'Profil zaktualizowany.' : 'Profil utworzony.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się zapisać profilu. Spróbuj ponownie.');
        this.loading.set(false);
      },
    });
  }

  private buildOpeningHoursGroup(): FormGroup<Record<DayKey, FormGroup<DayFormControls>>> {
    const groups = {} as Record<DayKey, FormGroup<DayFormControls>>;
    for (const day of WEEKDAYS) {
      groups[day.key] = this.fb.nonNullable.group(
        {
          enabled: [false],
          open: [{ value: '09:00', disabled: true }],
          close: [{ value: '17:00', disabled: true }],
        },
        { validators: closeAfterOpenValidator },
      );
    }
    return this.fb.group(groups) as FormGroup<Record<DayKey, FormGroup<DayFormControls>>>;
  }

  private registerDayToggleListeners(): void {
    for (const day of WEEKDAYS) {
      const group = this.getDayGroup(day.key);
      group.controls.enabled.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((enabled) => {
          if (enabled) {
            group.controls.open.enable();
            group.controls.close.enable();
          } else {
            group.controls.open.disable();
            group.controls.close.disable();
          }
        });
    }
  }

  private collectOpeningHours(): OpeningHours {
    const result: OpeningHours = {};
    for (const day of WEEKDAYS) {
      const raw = this.getDayGroup(day.key).getRawValue();
      if (raw.enabled) {
        result[day.key] = { open: raw.open, close: raw.close };
      }
    }
    return result;
  }

  private patchOpeningHours(hours: OpeningHours | null): void {
    for (const day of WEEKDAYS) {
      const dayData: OpeningHoursDay | undefined = hours?.[day.key];
      const group = this.getDayGroup(day.key);

      if (dayData) {
        group.controls.enabled.setValue(true, { emitEvent: true });
        group.controls.open.setValue(dayData.open);
        group.controls.close.setValue(dayData.close);
      } else {
        group.controls.enabled.setValue(false, { emitEvent: true });
        group.controls.open.setValue('09:00');
        group.controls.close.setValue('17:00');
      }
    }
  }
}
