import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notificationService.notification(); as n) {
      <div
        class="fixed bottom-4 right-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
        [class]="n.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'"
        [class.animate-toast-in]="!notificationService.leaving()"
        [class.animate-toast-out]="notificationService.leaving()"
        role="alert"
      >
        {{ n.message }}
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly notificationService = inject(NotificationService);
}
