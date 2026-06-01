import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync, unlink, access } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserResponse } from '../auth/dto/auth-response.dto';
import { Business } from '../generated/prisma/client';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOADS_DIR = join(process.cwd(), 'uploads');

const fsAccess = promisify(access);
const fsUnlink = promisify(unlink);

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  static validateMimeType(file: Express.Multer.File): void {
    if (!MIME_TO_EXTENSION[file.mimetype]) {
      throw new BadRequestException('Dozwolone formaty: JPG, PNG, WebP');
    }
  }

  static buildFilename(file: Express.Multer.File): string {
    const ext = MIME_TO_EXTENSION[file.mimetype] ?? '.bin';
    return `${randomUUID()}${ext}`;
  }

  static buildUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  private async deleteOldFile(url: string | null): Promise<void> {
    if (!url || !url.startsWith('/uploads/')) return;
    const filename = url.split('/').pop();
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    )
      return;
    const filepath = join(UPLOADS_DIR, filename);
    await fsAccess(filepath)
      .then(() => fsUnlink(filepath))
      .catch(() => undefined);
  }

  async updateUserAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<AuthUserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
      await this.deleteOldFile(user?.avatarUrl ?? null);
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      };
    } catch (err) {
      await this.deleteOldFile(avatarUrl);
      throw err;
    }
  }

  async updateBusinessLogo(
    ownerId: string,
    businessId: string,
    logoUrl: string,
  ): Promise<Business> {
    try {
      const business = await this.prisma.business.findFirst({
        where: { id: businessId, deletedAt: null },
      });
      if (!business)
        throw new NotFoundException(`Business with ID ${businessId} not found`);
      if (business.ownerId !== ownerId)
        throw new ForbiddenException('You are not the owner of this business');
      const updated = await this.prisma.business.update({
        where: { id: business.id },
        data: { logoUrl },
      });
      await this.deleteOldFile(business.logoUrl);
      return updated;
    } catch (err) {
      await this.deleteOldFile(logoUrl);
      throw err;
    }
  }

  async updateBusinessCover(
    ownerId: string,
    businessId: string,
    coverUrl: string,
  ): Promise<Business> {
    try {
      const business = await this.prisma.business.findFirst({
        where: { id: businessId, deletedAt: null },
      });
      if (!business)
        throw new NotFoundException(`Business with ID ${businessId} not found`);
      if (business.ownerId !== ownerId)
        throw new ForbiddenException('You are not the owner of this business');
      const updated = await this.prisma.business.update({
        where: { id: business.id },
        data: { coverUrl },
      });
      await this.deleteOldFile(business.coverUrl);
      return updated;
    } catch (err) {
      await this.deleteOldFile(coverUrl);
      throw err;
    }
  }
}
