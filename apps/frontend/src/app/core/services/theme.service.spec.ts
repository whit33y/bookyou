import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

interface MockMediaQueryList {
  matches: boolean;
  addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
  emit: (matches: boolean) => void;
}

function mockMatchMedia(systemPrefersDark: boolean): MockMediaQueryList {
  const listeners: ((event: MediaQueryListEvent) => void)[] = [];
  const mql: MockMediaQueryList = {
    matches: systemPrefersDark,
    addEventListener: (_type, listener) => listeners.push(listener),
    emit: (matches) => {
      mql.matches = matches;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
  vi.stubGlobal('matchMedia', () => mql);
  return mql;
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'theme-transition');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the system preference when nothing is stored', () => {
    mockMatchMedia(true);
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('reads the stored preference over the system one', () => {
    localStorage.setItem('theme', 'light');
    mockMatchMedia(true);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('toggles, persists and applies the dark class', () => {
    mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');

    // The deliberate switch opts into the brief colour transition...
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    service.toggle();
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('removes the transition class after the animation and survives rapid toggles', () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);

    // A second toggle inside the window resets the timer, so the first toggle's
    // pending removal must not strip the class mid-animation.
    vi.advanceTimersByTime(150);
    service.toggle();
    vi.advanceTimersByTime(150);
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);

    // Once the latest window fully elapses, the class is cleaned up.
    vi.advanceTimersByTime(250);
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);

    vi.useRealTimers();
  });

  it('reacts to system changes until the user makes an explicit choice', () => {
    const mql = mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');

    mql.emit(true);
    expect(service.theme()).toBe('dark');

    // Once the user picks a theme, system changes are ignored.
    service.setTheme('light');
    mql.emit(true);
    expect(service.theme()).toBe('light');
  });
});
