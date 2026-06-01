import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

@Component({
  selector: 'app-image-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-upload.html',
})
export class ImageUploadComponent {
  readonly label = input.required<string>();
  readonly currentUrl = input<string | null | undefined>(null);
  readonly shape = input<'circle' | 'rectangle'>('circle');
  readonly uploading = input<boolean>(false);

  readonly fileSelected = output<File>();

  protected readonly inputId = `image-upload-${crypto.randomUUID()}`;
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly error = signal('');

  protected readonly displayUrl = computed(() => this.previewUrl() ?? this.currentUrl() ?? null);

  protected readonly containerClass = computed(() =>
    this.shape() === 'circle' ? 'h-24 w-24 rounded-full' : 'h-32 w-full max-w-xs rounded-lg',
  );

  constructor() {
    // Clear preview on upload end (success: new currentUrl arrives; failure: uploading → false)
    effect(
      () => {
        this.currentUrl();
        if (!this.uploading()) this.previewUrl.set(null);
      },
      { allowSignalWrites: true },
    );
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Niedozwolony format. Akceptowane: JPG, PNG, WebP');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      this.error.set(`Maksymalny rozmiar pliku to ${MAX_SIZE_MB}MB`);
      return;
    }

    this.error.set('');

    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.fileSelected.emit(file);
  }
}
