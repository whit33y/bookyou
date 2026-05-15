import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.RegisterComponent),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'businesses',
        loadComponent: () =>
          import('./features/businesses/businesses').then((m) => m.BusinessesComponent),
      },
      {
        path: 'businesses/:id',
        loadComponent: () =>
          import('./features/businesses/business-details').then((m) => m.BusinessDetailsComponent),
      },
      {
        path: 'my-appointments',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/appointments/my-appointments').then((m) => m.MyAppointmentsComponent),
      },
      {
        path: 'calendar',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/calendar/provider-calendar').then((m) => m.ProviderCalendarComponent),
      },
    ],
  },
];
