import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, Role } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-token',
    user: {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      avatarUrl: null,
      role: Role.CLIENT,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should login and store token', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('mock-token');
    expect(service.currentUser()?.email).toBe('test@test.com');
  });

  it('should register and store token', () => {
    service.register({ email: 'test@test.com', password: 'password123' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('mock-token');
    expect(service.currentUser()?.email).toBe('test@test.com');
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', JSON.stringify(mockAuthResponse.user));

    const navigateSpy = vi.spyOn(router, 'navigate');
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should return isAuthenticated based on token', () => {
    expect(service.isAuthenticated()).toBe(false);
    localStorage.setItem('access_token', 'token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('user', 'invalid-json');
    const newService = TestBed.inject(AuthService);
    expect(newService.currentUser()).toBeNull();
  });
});
