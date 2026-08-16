import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { MediaService } from './media.service';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
    storage: memoryStorage(),
  }))
  async uploadEvidence(
    @Param('workOrderId') workOrderId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    await this.workOrders.assertCanAttachEvidence(workOrderId, user);
    if (!file || !allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG or WEBP images are accepted');
    }
    return this.media.saveEvidence(workOrderId, file, user.id);
  }

  @Get('work-orders/:workOrderId/evidence')
  async listEvidence(@Param('workOrderId') workOrderId: string) {
    await this.workOrders.findOne(workOrderId);
    return this.media.listEvidence(workOrderId);
  }

  @Get('evidence/:filename')
  getEvidence(@Param('filename') filename: string, @Res() response: Response) {
    const location = this.media.getEvidenceLocation(filename);
    if (location.kind === 'remote') return response.redirect(location.url);
    return response.sendFile(location.path);
  }
}
