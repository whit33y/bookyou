import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notification = signal<Notification | null>(null);
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

  private show(notification: Notification): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.notification.set(notification);
    this.timeoutId = setTimeout(() => {
      this.notification.set(null);
      this.timeoutId = undefined;
    }, 4000);
  }
}
