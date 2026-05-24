import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  type: 'success' | 'error';
}

const NOTIFICATION_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notification = signal<AppNotification | null>(null);
  private timeoutId?: ReturnType<typeof setTimeout>;

  success(message: string): void {
    this.show({ message, type: 'success' });
  }

  error(message: string): void {
    this.show({ message, type: 'error' });
  }

  dismiss(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.notification.set(null);
  }

  private show(notification: AppNotification): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.notification.set(notification);
    this.timeoutId = setTimeout(() => {
      this.notification.set(null);
      this.timeoutId = undefined;
    }, NOTIFICATION_DURATION_MS);
  }
}
