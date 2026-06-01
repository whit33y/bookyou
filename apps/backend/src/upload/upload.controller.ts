import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MAX_FILE_SIZE_BYTES, UploadService } from './upload.service';

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  try {
    UploadService.validateMimeType(file);
    cb(null, true);
  } catch (err) {
    cb(err as Error, false);
  }
}

const multerOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
      cb(null, UploadService.buildFilename(file));
    },
  }),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
};

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'No file provided or invalid file.',
  })
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

  @Post('business-logo/:businessId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business logo' })
  @ApiParam({ name: 'businessId', description: 'ID of the business to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'No file provided or invalid file.',
  })
  @ApiResponse({ status: 403, description: 'Not the owner of this business.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  async uploadBusinessLogo(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') ownerId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }
    const url = UploadService.buildUrl(file.filename);
    return this.uploadService.updateBusinessLogo(ownerId, businessId, url);
  }

  @Post('business-cover/:businessId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business cover image' })
  @ApiParam({ name: 'businessId', description: 'ID of the business to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Cover uploaded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'No file provided or invalid file.',
  })
  @ApiResponse({ status: 403, description: 'Not the owner of this business.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  async uploadBusinessCover(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') ownerId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }
    const url = UploadService.buildUrl(file.filename);
    return this.uploadService.updateBusinessCover(ownerId, businessId, url);
  }
}
