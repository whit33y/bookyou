import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-navigation />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class LayoutComponent {}
