import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Manages the application colour theme.
 *
 * The active theme is exposed as a signal and mirrored onto the `<html>`
 * element via the `dark` class (which drives Tailwind's `dark:` variant).
 * The user's explicit choice is persisted in `localStorage`; until they make
 * one, the theme follows the operating system's `prefers-color-scheme`.
 *
 * The initial class is set by a small inline script in `index.html` before the
 * app boots (avoiding a flash of the wrong theme), so this service reads the
 * already-applied state to stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly root = this.document.documentElement;

  private readonly _theme = signal<Theme>(this.readInitialTheme());

  /** The currently active theme. */
  readonly theme = this._theme.asReadonly();
  /** Convenience flag for templates and the toggle button. */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Keep the document class in sync with the signal.
    effect(() => this.applyTheme(this._theme()));

    // Follow the system preference live, but only until the user has made an
    // explicit choice (i.e. nothing stored yet).
    this.mediaQuery()?.addEventListener('change', (event) => {
      if (!this.storedTheme()) {
        this._theme.set(event.matches ? 'dark' : 'light');
      }
    });
  }

  /** Flip between light and dark and persist the choice. */
  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  /** Explicitly set and persist a theme. */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
    this.persist(theme);
  }

  private applyTheme(theme: Theme): void {
    this.root.classList.toggle('dark', theme === 'dark');
  }

  private readInitialTheme(): Theme {
    const stored = this.storedTheme();
    if (stored) {
      return stored;
    }
    return this.mediaQuery()?.matches ? 'dark' : 'light';
  }

  private storedTheme(): Theme | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private persist(theme: Theme): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (e.g. private mode); the theme still applies.
    }
  }

  private mediaQuery(): MediaQueryList | null {
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)') ?? null;
  }
}
