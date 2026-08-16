import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { Evidence } from './entities/evidence.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule, WorkOrdersModule, TypeOrmModule.forFeature([Evidence])],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
