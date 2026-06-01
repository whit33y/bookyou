import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from './upload.service';

const multerStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, UploadService.buildFilename(file));
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  try {
    UploadService.validateFile(file);
    cb(null, true);
  } catch (err) {
    cb(err as Error, false);
  }
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', { storage: multerStorage, fileFilter }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'No file provided.' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }
    const url = UploadService.buildUrl(file.filename);
    return this.uploadService.updateUserAvatar(userId, url);
  }

  @Post('business-logo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', { storage: multerStorage, fileFilter }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business logo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'No file provided.' })
  async uploadBusinessLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') ownerId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }
    const url = UploadService.buildUrl(file.filename);
    return this.uploadService.updateBusinessLogo(ownerId, url);
  }

  @Post('business-cover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', { storage: multerStorage, fileFilter }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business cover image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Cover uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'No file provided.' })
  async uploadBusinessCover(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') ownerId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }
    const url = UploadService.buildUrl(file.filename);
    return this.uploadService.updateBusinessCover(ownerId, url);
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Serve an uploaded file' })
  @ApiResponse({ status: 200, description: 'Returns the file.' })
  @ApiResponse({ status: 404, description: 'File not found.' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Prevent path traversal — only allow safe filename characters
    if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      return res.status(404).send();
    }
    const filepath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filepath)) {
      return res.status(404).send();
    }
    return res.sendFile(filepath);
  }
}
