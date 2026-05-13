import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('should allow access when authenticated', () => {
    localStorage.setItem('access_token', 'token');
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );
    expect(result).toBe(true);
  });

  it('should redirect to /login with returnUrl when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );
    expect(result).toEqual(
      router.createUrlTree(['/login'], { queryParams: { returnUrl: '/dashboard' } }),
    );
  });
});
