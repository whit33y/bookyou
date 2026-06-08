import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-white border-t border-gray-200 py-6 dark:bg-gray-800 dark:border-gray-700">
      <div class="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {{ year }} BookYou. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
