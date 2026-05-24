import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { UpcomingAppointmentsComponent } from './upcoming-appointments';

registerLocaleData(localePl);

function createMockAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: '1',
    status: AppointmentStatus.CONFIRMED,
    startTime: '2025-06-15T10:00:00.000Z',
    endTime: '2025-06-15T10:30:00.000Z',
    clientId: 'client-1',
    providerId: 'provider-1',
    serviceId: 'service-1',
    businessId: 'business-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    service: { id: 'service-1', name: 'Strzyżenie męskie', duration: 30, price: 50 },
    business: {
      id: 'business-1',
      name: 'Salon Fryzjerski',
      street: 'ul. Testowa 1',
      city: 'Warszawa',
      zipCode: '00-001',
      ownerId: 'owner-1',
    },
    provider: { id: 'provider-1', name: 'Jan Kowalski', email: 'jan@test.com' },
    client: { id: 'client-1', name: 'Anna Nowak', email: 'anna@test.com' },
    ...overrides,
  };
}

@Component({
  standalone: true,
  imports: [UpcomingAppointmentsComponent],
  template: `<app-upcoming-appointments [appointments]="appointments" [loading]="loading" />`,
})
class TestHostComponent {
  appointments: Appointment[] = [];
  loading = false;
}

describe('UpcomingAppointmentsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    hostElement = fixture.nativeElement;
  });

  it('should create', () => {
    const section = hostElement.querySelector('section');
    expect(section).toBeTruthy();
  });

  it('should render a section with proper heading', () => {
    const heading = hostElement.querySelector('h2');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Nadchodzące wizyty');
  });

  it('should have aria-labelledby linking heading to section', () => {
    const section = hostElement.querySelector('section');
    const heading = hostElement.querySelector('h2');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  describe('loading state', () => {
    beforeEach(() => {
      fixture.componentInstance.loading = true;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    });

    it('should display a spinner when loading', () => {
      const spinner = hostElement.querySelector('[aria-label="Ładowanie wizyt"]');
      expect(spinner).toBeTruthy();
    });

    it('should not display the appointment list when loading', () => {
      const list = hostElement.querySelector('ul');
      expect(list).toBeNull();
    });
  });

  describe('empty state', () => {
    it('should display empty message when no appointments', () => {
      expect(hostElement.textContent).toContain('Brak nadchodzących wizyt');
    });

    it('should display a CTA button linking to /businesses', () => {
      const link = hostElement.querySelector('a[href="/businesses"]');
      expect(link).toBeTruthy();
      expect(link?.textContent?.trim()).toBe('Zarezerwuj wizytę');
    });
  });

  describe('appointments list', () => {
    const mockAppointments = [
      createMockAppointment({ id: '1' }),
      createMockAppointment({
        id: '2',
        startTime: '2025-06-16T14:00:00.000Z',
        endTime: '2025-06-16T15:00:00.000Z',
        service: { id: 'service-2', name: 'Koloryzacja', duration: 60, price: 150 },
        provider: { id: 'provider-2', name: 'Maria Wiśniewska', email: 'maria@test.com' },
        business: {
          id: 'business-2',
          name: 'Beauty Studio',
          street: 'ul. Piękna 5',
          city: 'Kraków',
          zipCode: '30-001',
          ownerId: 'owner-2',
        },
      }),
    ];

    beforeEach(() => {
      fixture.componentInstance.appointments = mockAppointments;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    });

    it('should render a list of appointments', () => {
      const list = hostElement.querySelector('ul');
      expect(list).toBeTruthy();
      const items = hostElement.querySelectorAll('li');
      expect(items.length).toBe(2);
    });

    it('should display service name for each appointment', () => {
      expect(hostElement.textContent).toContain('Strzyżenie męskie');
      expect(hostElement.textContent).toContain('Koloryzacja');
    });

    it('should display specialist name for each appointment', () => {
      expect(hostElement.textContent).toContain('Jan Kowalski');
      expect(hostElement.textContent).toContain('Maria Wiśniewska');
    });

    it('should display business name for each appointment', () => {
      expect(hostElement.textContent).toContain('Salon Fryzjerski');
      expect(hostElement.textContent).toContain('Beauty Studio');
    });

    it('should display "Specjalista" when provider name is null', () => {
      fixture.componentInstance.appointments = [
        createMockAppointment({
          provider: { id: 'provider-1', name: null, email: 'jan@test.com' },
        }),
      ];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(hostElement.textContent).toContain('Specjalista');
    });

    it('should not display empty state message', () => {
      expect(hostElement.textContent).not.toContain('Brak nadchodzących wizyt');
    });
  });
});
