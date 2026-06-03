import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { UploadService } from './upload.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly uploadService = inject(UploadService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'access_token';
  private readonly userKey = 'user';

  currentUser = signal<User | null>(this.getUserFromStorage());

  login(data: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  register(data: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  updateProfile(data: { name?: string; email?: string }) {
    return this.http.patch<User>(`${this.apiUrl}/me`, data).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, data);
  }

  uploadAvatar(file: File) {
    return this.uploadService.uploadAvatar(file).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(this.tokenKey, res.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private getUserFromStorage(): User | null {
    try {
      if (!localStorage.getItem(this.tokenKey)) return null;
      const user = localStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }
}
