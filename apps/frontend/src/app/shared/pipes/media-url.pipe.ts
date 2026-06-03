import { inject, Pipe, PipeTransform } from '@angular/core';
import { UploadService } from '../../core/services/upload.service';

@Pipe({ name: 'mediaUrl' })
export class MediaUrlPipe implements PipeTransform {
  private readonly uploadService = inject(UploadService);

  transform(path: string | null | undefined): string | null {
    return this.uploadService.resolveUrl(path);
  }
}
