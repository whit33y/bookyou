export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface BusinessSearchParams {
  search?: string;
  city?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface OpeningHoursDay {
  open: string;
  close: string;
}

export interface OpeningHours {
  monday?: OpeningHoursDay;
  tuesday?: OpeningHoursDay;
  wednesday?: OpeningHoursDay;
  thursday?: OpeningHoursDay;
  friday?: OpeningHoursDay;
  saturday?: OpeningHoursDay;
  sunday?: OpeningHoursDay;
}

export interface Business {
  id: string;
  name: string;
  description: string | null;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  openingHours: OpeningHours | null;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
  averageRating?: number | null;
  reviewCount?: number;
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  street: string;
  city: string;
  zipCode: string;
  country?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: OpeningHours;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: OpeningHours;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  businessId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  duration: number;
  price: number;
  categoryId?: string | null;
}

export interface UpdateServiceRequest {
  name?: string;
  duration?: number;
  price?: number;
  categoryId?: string | null;
}
