import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { Repository } from 'typeorm';
import { Evidence } from './entities/evidence.entity';

const extensionByMime: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Evidence) private readonly evidence: Repository<Evidence>,
    private readonly config: ConfigService,
  ) {}

  async saveEvidence(workOrderId: string, file: Express.Multer.File, uploadedByUserId?: string) {
    const extension = extensionByMime[file.mimetype];
    if (!extension) throw new BadRequestException('Only JPG, PNG or WEBP images are accepted');

    const filename = this.storageProvider() === 'cloudinary'
      ? await this.uploadToCloudinary(file, extension)
      : this.saveLocally(file, extension);

    return this.evidence.save(
      this.evidence.create({
        workOrderId,
        filename,
        originalName: basename(file.originalname),
        mimeType: file.mimetype,
        size: file.size,
        uploadedByUserId,
      }),
    );
  }

  listEvidence(workOrderId: string) {
    return this.evidence.find({ where: { workOrderId }, order: { createdAt: 'DESC' } });
  }

  getEvidenceLocation(filename: string): { kind: 'local'; path: string } | { kind: 'remote'; url: string } {
    if (basename(filename) !== filename) throw new BadRequestException('Invalid filename');

    if (this.storageProvider() === 'cloudinary') {
      const cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
      return {
        kind: 'remote',
        url: `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${encodeURIComponent(filename)}`,
      };
    }

    const path = join(process.cwd(), 'uploads', 'evidence', filename);
    if (!existsSync(path)) throw new NotFoundException('Evidence file not found');
    return { kind: 'local', path };
  }

  private storageProvider() {
    return String(this.config.get('MEDIA_STORAGE', 'local')).toLowerCase();
  }

  private saveLocally(file: Express.Multer.File, extension: string) {
    const directory = join(process.cwd(), 'uploads', 'evidence');
    mkdirSync(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    writeFileSync(join(directory, filename), file.buffer);
    return filename;
  }

  private async uploadToCloudinary(file: Express.Multer.File, extension: string) {
    const cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `garageflow-evidence-${randomUUID()}`;
    const signature = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const form = new FormData();
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('public_id', publicId);
    form.append('signature', signature);
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), basename(file.originalname));

    let response: Response;
    try {
      response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: 'POST',
        body: form,
      });
    } catch {
      throw new ServiceUnavailableException('Media storage is temporarily unavailable');
    }

    const payload = await response.json() as { error?: { message?: string }; public_id?: string; format?: string };
    if (!response.ok || !payload.public_id) {
      throw new ServiceUnavailableException(payload.error?.message ?? 'Cloudinary upload failed');
    }

    const format = payload.format || extension.replace('.', '');
    return `${payload.public_id}.${format}`;
  }
}
