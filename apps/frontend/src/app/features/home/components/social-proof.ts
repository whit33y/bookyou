import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import { DiscoveryService } from '../../../core/services/discovery.service';

@Component({
  selector: 'app-social-proof',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="social-proof-heading"
      class="w-full bg-indigo-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div class="mx-auto max-w-5xl">
        <h2 id="social-proof-heading" class="sr-only">Statystyki platformy</h2>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div class="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
            <span class="text-3xl font-bold text-indigo-600 sm:text-4xl">{{
              specialistCount()
            }}</span>
            <span class="mt-1 text-sm text-gray-600">Specjalistów</span>
          </div>
          <div class="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
            <span class="text-3xl font-bold text-indigo-600 sm:text-4xl">{{ cityCount() }}</span>
            <span class="mt-1 text-sm text-gray-600">Miast</span>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SocialProofComponent implements OnInit {
  private readonly discoveryService = inject(DiscoveryService);

  readonly specialistCount = computed(() => this.discoveryService.businesses().length);
  readonly cityCount = computed(
    () => new Set(this.discoveryService.businesses().map((b) => b.city)).size,
  );

  ngOnInit(): void {
    this.discoveryService.loadBusinesses();
  }
}
