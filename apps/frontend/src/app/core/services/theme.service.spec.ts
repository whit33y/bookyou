import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

interface MockMediaQueryList {
  matches: boolean;
  addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
  emit: (matches: boolean) => void;
}

function mockMatchMedia(systemPrefersDark: boolean): MockMediaQueryList {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];
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
    document.documentElement.classList.remove('dark');
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

    service.toggle();
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
