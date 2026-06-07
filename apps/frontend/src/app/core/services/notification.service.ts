import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  type: 'success' | 'error';
}

const NOTIFICATION_DURATION_MS = 4000;
/** Kept in sync with the `toast-out` keyframe duration in styles.css. */
const EXIT_ANIMATION_MS = 200;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notification = signal<AppNotification | null>(null);
  /** True while the current toast plays its exit animation before being cleared. */
  readonly leaving = signal(false);

  private autoDismissId?: ReturnType<typeof setTimeout>;
  private exitId?: ReturnType<typeof setTimeout>;

  success(message: string): void {
    this.show({ message, type: 'success' });
  }

  error(message: string): void {
    this.show({ message, type: 'error' });
  }

  /** Plays the exit animation, then removes the toast from the DOM. */
  dismiss(): void {
    if (!this.notification() || this.leaving()) return;
    this.clearTimers();
    this.leaving.set(true);
    this.exitId = setTimeout(() => {
      this.exitId = undefined;
      this.notification.set(null);
      this.leaving.set(false);
    }, EXIT_ANIMATION_MS);
  }

  private show(notification: AppNotification): void {
    this.clearTimers();
    this.leaving.set(false);
    this.notification.set(notification);
    this.autoDismissId = setTimeout(() => {
      this.autoDismissId = undefined;
      this.dismiss();
    }, NOTIFICATION_DURATION_MS);
  }

  private clearTimers(): void {
    if (this.autoDismissId) {
      clearTimeout(this.autoDismissId);
      this.autoDismissId = undefined;
    }
    if (this.exitId) {
      clearTimeout(this.exitId);
      this.exitId = undefined;
    }
  }
}
