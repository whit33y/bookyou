export type ReviewSort = 'newest' | 'highest' | 'lowest';

export interface ReviewAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  clientId: string;
  businessId: string;
  appointmentId: string;
  createdAt: string;
  updatedAt: string;
  client: ReviewAuthor;
}

export interface ReviewsResponse {
  data: Review[];
  total: number;
  limit: number;
  offset: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface CreateReviewRequest {
  appointmentId: string;
  rating: number;
  comment?: string;
}
