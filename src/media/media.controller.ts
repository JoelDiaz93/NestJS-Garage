import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { MediaService } from './media.service';

const imageFilter = (_req: Express.Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  callback(null, allowed.includes(file.mimetype));
};

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService, private readonly workOrders: WorkOrdersService) {}

  @Post('work-orders/:workOrderId/evidence')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter,
    storage: diskStorage({
      destination: './uploads/evidence',
      filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
  }))
  async uploadEvidence(@Param('workOrderId') workOrderId: string, @UploadedFile() file?: Express.Multer.File) {
    await this.workOrders.findOne(workOrderId);
    if (!file) throw new BadRequestException('Only JPG, PNG or WEBP images are accepted');
    return { workOrderId, filename: file.filename, size: file.size, mimeType: file.mimetype };
  }

  @Get('evidence/:filename')
  getEvidence(@Param('filename') filename: string, @Res() response: Response) {
    return response.sendFile(this.media.getEvidencePath(filename));
  }
}
