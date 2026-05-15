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
  openingHours: OpeningHours | null;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  street: string;
  city: string;
  zipCode: string;
  country?: string;
  openingHours?: OpeningHours;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  openingHours?: OpeningHours;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  duration: number;
  price: number;
}

export interface UpdateServiceRequest {
  name?: string;
  duration?: number;
  price?: number;
}
