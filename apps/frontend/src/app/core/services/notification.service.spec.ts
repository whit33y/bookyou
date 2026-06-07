import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('shows a success notification immediately', () => {
    service.success('Zapisano');
    expect(service.notification()).toEqual({ message: 'Zapisano', type: 'success' });
    expect(service.leaving()).toBe(false);
  });

  it('plays the exit animation before clearing on dismiss', () => {
    service.error('Błąd');
    service.dismiss();

    expect(service.leaving()).toBe(true);
    expect(service.notification()).not.toBeNull();

    vi.advanceTimersByTime(200);
    expect(service.notification()).toBeNull();
    expect(service.leaving()).toBe(false);
  });

  it('auto-dismisses after the configured timeout', () => {
    service.success('Cześć');

    vi.advanceTimersByTime(4000);
    expect(service.leaving()).toBe(true);

    vi.advanceTimersByTime(200);
    expect(service.notification()).toBeNull();
  });

  it('replacing a leaving toast cancels the pending clear', () => {
    service.success('Pierwszy');
    service.dismiss();
    expect(service.leaving()).toBe(true);

    service.success('Drugi');
    expect(service.leaving()).toBe(false);
    expect(service.notification()).toEqual({ message: 'Drugi', type: 'success' });

    // The earlier exit timer must not clear the freshly shown toast.
    vi.advanceTimersByTime(200);
    expect(service.notification()).toEqual({ message: 'Drugi', type: 'success' });
  });

  it('ignores dismiss when no toast is visible', () => {
    service.dismiss();
    expect(service.leaving()).toBe(false);
    expect(service.notification()).toBeNull();
  });
});
