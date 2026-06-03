import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync, unlink } from 'fs';
import { open } from 'fs/promises';
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

const fsUnlink = promisify(unlink);

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  static validateMimeType(file: Express.Multer.File): void {
    if (!MIME_TO_EXTENSION[file.mimetype]) {
      throw new BadRequestException('Allowed formats: JPG, PNG, WebP');
    }
  }

  static buildFilename(file: Express.Multer.File): string {
    const ext = MIME_TO_EXTENSION[file.mimetype] ?? '.bin';
    return `${randomUUID()}${ext}`;
  }

  static buildUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  // Detects the real image type from the file's magic numbers, ignoring the
  // client-provided MIME type (which can be spoofed). Returns null if the
  // header does not match an allowed image format.
  static detectImageMime(buffer: Buffer): string | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp';
    }
    return null;
  }

  private urlToFilepath(url: string | null): string | null {
    if (!url || !url.startsWith('/uploads/')) return null;
    const filename = url.split('/').pop();
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return null;
    }
    return join(UPLOADS_DIR, filename);
  }

  // Reads the file header and rejects anything that is not a genuine
  // JPG/PNG/WebP image, regardless of the declared MIME type or extension.
  private async assertRealImage(url: string): Promise<void> {
    const filepath = this.urlToFilepath(url);
    if (!filepath) {
      throw new BadRequestException('Allowed formats: JPG, PNG, WebP');
    }
    const handle = await open(filepath, 'r');
    try {
      const buffer = Buffer.alloc(12);
      await handle.read(buffer, 0, 12, 0);
      if (!UploadService.detectImageMime(buffer)) {
        throw new BadRequestException('Allowed formats: JPG, PNG, WebP');
      }
    } finally {
      await handle.close();
    }
  }

  private async deleteOldFile(url: string | null): Promise<void> {
    const filepath = this.urlToFilepath(url);
    if (!filepath) return;
    await fsUnlink(filepath).catch(() => undefined);
  }

  async updateUserAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<AuthUserResponse> {
    try {
      await this.assertRealImage(avatarUrl);
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
      await this.assertRealImage(logoUrl);
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
      await this.assertRealImage(coverUrl);
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
