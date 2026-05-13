import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header for API requests when token exists', () => {
    localStorage.setItem('access_token', 'my-token');
    http.get('http://localhost:3000/api/test').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('should not add Authorization header for non-API requests', () => {
    localStorage.setItem('access_token', 'my-token');
    http.get('https://external-api.com/data').subscribe();

    const req = httpMock.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('should not add Authorization header when no token', () => {
    http.get('http://localhost:3000/api/test').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });
});
