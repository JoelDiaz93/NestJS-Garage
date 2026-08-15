import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { basename, join } from 'path';
@Injectable()
export class MediaService {
  getEvidencePath(filename: string) {
    if (basename(filename) !== filename) throw new BadRequestException('Invalid filename');
    const path = join(process.cwd(), 'uploads', 'evidence', filename);
    if (!existsSync(path)) throw new NotFoundException('Evidence file not found');
    return path;
  }
}
