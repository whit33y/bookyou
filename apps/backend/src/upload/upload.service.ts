import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserResponse } from '../auth/dto/auth-response.dto';
import { Business } from '../generated/prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  static validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ForbiddenException('Dozwolone formaty: JPG, PNG, WebP');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ForbiddenException('Maksymalny rozmiar pliku to 5MB');
    }
  }

  static buildFilename(file: Express.Multer.File): string {
    return `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
  }

  static buildUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  private deleteOldFile(url: string | null): void {
    if (!url) return;
    const filename = url.split('/').pop();
    if (!filename) return;
    const filepath = join(UPLOADS_DIR, filename);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
  }

  async updateUserAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    this.deleteOldFile(user?.avatarUrl ?? null);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      avatarUrl: updated.avatarUrl,
    };
  }

  async updateBusinessLogo(
    ownerId: string,
    logoUrl: string,
  ): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
    });

    if (!business) {
      throw new NotFoundException(
        'Nie znaleziono biznesu dla tego usługodawcy',
      );
    }

    this.deleteOldFile(business.logoUrl);

    return this.prisma.business.update({
      where: { id: business.id },
      data: { logoUrl },
    });
  }

  async updateBusinessCover(
    ownerId: string,
    coverUrl: string,
  ): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
    });

    if (!business) {
      throw new NotFoundException(
        'Nie znaleziono biznesu dla tego usługodawcy',
      );
    }

    this.deleteOldFile(business.coverUrl);

    return this.prisma.business.update({
      where: { id: business.id },
      data: { coverUrl },
    });
  }
}
