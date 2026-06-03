import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UploadService } from '../../core/services/upload.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) return null;
  return newPassword !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, ImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private notifications = inject(NotificationService);

  profileForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  profileLoading = signal(false);
  passwordLoading = signal(false);
  avatarUploading = signal(false);
  profileError = signal('');
  passwordError = signal('');

  readonly avatarUrl = computed(() =>
    this.uploadService.resolveUrl(this.authService.currentUser()?.avatarUrl),
  );

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name ?? '',
        email: user.email,
      });
    }
  }

  onProfileSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading.set(true);
    this.profileError.set('');

    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Dane zostały zaktualizowane.');
        this.profileLoading.set(false);
      },
      error: (err) => {
        this.profileError.set(
          err.status === 409
            ? 'Ten adres email jest już zajęty.'
            : 'Nie udało się zaktualizować danych.',
        );
        this.profileLoading.set(false);
      },
    });
  }

  onAvatarSelected(file: File): void {
    this.avatarUploading.set(true);
    this.authService.uploadAvatar(file).subscribe({
      next: () => {
        this.notifications.success('Avatar został zaktualizowany.');
        this.avatarUploading.set(false);
      },
      error: () => {
        this.notifications.error('Nie udało się przesłać avatara.');
        this.avatarUploading.set(false);
      },
    });
  }

  onPasswordSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading.set(true);
    this.passwordError.set('');

    const { oldPassword, newPassword } = this.passwordForm.getRawValue();

    this.authService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.notifications.success('Hasło zostało zmienione.');
        this.passwordForm.reset();
        this.passwordLoading.set(false);
      },
      error: (err) => {
        this.passwordError.set(
          err.status === 401
            ? 'Aktualne hasło jest nieprawidłowe.'
            : 'Nie udało się zmienić hasła.',
        );
        this.passwordLoading.set(false);
      },
    });
  }
}
