import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReviewRequest, Review, ReviewSort, ReviewsResponse } from '../models/review.model';

interface GetReviewsOptions {
  sort?: ReviewSort;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  getBusinessReviews(
    businessId: string,
    options: GetReviewsOptions = {},
  ): Observable<ReviewsResponse> {
    let params = new HttpParams();
    if (options.sort) params = params.set('sort', options.sort);
    if (options.limit != null) params = params.set('limit', options.limit.toString());
    if (options.offset != null) params = params.set('offset', options.offset.toString());

    return this.http.get<ReviewsResponse>(`${this.apiUrl}/business/${businessId}`, {
      params,
    });
  }

  create(data: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, data);
  }
}
