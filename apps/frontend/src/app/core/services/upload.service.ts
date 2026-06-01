import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Business } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly uploadUrl = `${environment.apiUrl}/upload`;

  uploadAvatar(file: File): Observable<User> {
    return this.http.post<User>(`${this.uploadUrl}/avatar`, this.toFormData(file));
  }

  uploadBusinessLogo(file: File, businessId: string): Observable<Business> {
    return this.http.post<Business>(
      `${this.uploadUrl}/business-logo/${businessId}`,
      this.toFormData(file),
    );
  }

  uploadBusinessCover(file: File, businessId: string): Observable<Business> {
    return this.http.post<Business>(
      `${this.uploadUrl}/business-cover/${businessId}`,
      this.toFormData(file),
    );
  }

  resolveUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('//') ||
      path.startsWith('data:')
    ) {
      return path;
    }
    return `${environment.mediaUrl}${path}`;
  }

  private toFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }
}
