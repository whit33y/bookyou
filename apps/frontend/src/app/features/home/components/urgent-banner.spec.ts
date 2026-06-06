import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { UrgentBannerComponent } from './urgent-banner';

function createMockAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: '1',
    status: AppointmentStatus.CONFIRMED,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
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
    review: null,
    ...overrides,
  };
}

@Component({
  standalone: true,
  imports: [UrgentBannerComponent],
  template: `<app-urgent-banner [appointment]="appointment" [now]="now" />`,
})
class TestHostComponent {
  appointment = createMockAppointment();
  now = new Date();
}

describe('UrgentBannerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    hostElement = fixture.nativeElement;
  });

  it('should create', () => {
    const banner = hostElement.querySelector('app-urgent-banner');
    expect(banner).toBeTruthy();
  });

  it('should have role="alert" for accessibility', () => {
    const banner = hostElement.querySelector('app-urgent-banner');
    expect(banner?.getAttribute('role')).toBe('alert');
  });

  it('should have aria-live="polite" for accessibility', () => {
    const banner = hostElement.querySelector('app-urgent-banner');
    expect(banner?.getAttribute('aria-live')).toBe('polite');
  });

  it('should display the service name', () => {
    expect(hostElement.textContent).toContain('Strzyżenie męskie');
  });

  it('should display the specialist name', () => {
    expect(hostElement.textContent).toContain('Jan Kowalski');
  });

  it('should display "Specjalista" when provider name is null', async () => {
    fixture.componentInstance.appointment = createMockAppointment({
      provider: { id: 'provider-1', name: null, email: 'jan@test.com' },
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Specjalista');
  });

  it('should display time until appointment', () => {
    const text = hostElement.textContent ?? '';
    expect(text).toContain('za');
    expect(text).toContain('godzin');
  });

  it('should display "teraz" when appointment time has passed', async () => {
    fixture.componentInstance.appointment = createMockAppointment({
      startTime: new Date(Date.now() - 1000).toISOString(),
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('teraz');
  });

  it('should display minutes when less than 1 hour away', async () => {
    fixture.componentInstance.appointment = createMockAppointment({
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('minut');
  });
});
