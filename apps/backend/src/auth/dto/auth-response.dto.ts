import { Role } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
}
