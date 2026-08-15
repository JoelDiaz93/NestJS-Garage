import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
@Module({ imports: [AuthModule, WorkOrdersModule], controllers: [MediaController], providers: [MediaService] })
export class MediaModule {}
