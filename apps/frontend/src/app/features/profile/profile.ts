import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);

  profileForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  profileLoading = signal(false);
  passwordLoading = signal(false);
  profileError = signal('');
  passwordError = signal('');

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

  onPasswordSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.passwordError.set('Hasła nie są identyczne.');
      return;
    }

    this.passwordLoading.set(true);
    this.passwordError.set('');

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
