export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NOSHOW = 'NOSHOW',
}

export interface AppointmentUser {
  id: string;
  name: string | null;
  email: string;
}

export interface AppointmentService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface AppointmentBusiness {
  id: string;
  name: string;
  street: string;
  city: string;
  zipCode: string;
  ownerId: string;
}

export interface AppointmentReview {
  id: string;
  rating: number;
  comment: string | null;
}

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  service: AppointmentService;
  business: AppointmentBusiness;
  provider: AppointmentUser;
  client: AppointmentUser;
  review: AppointmentReview | null;
}

export interface CreateAppointmentRequest {
  startTime: string;
  serviceId: string;
  businessId: string;
  providerId: string;
}
