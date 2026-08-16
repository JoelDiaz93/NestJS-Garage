import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogItem } from './catalog-item.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { InventoryMovement } from './entities/inventory-movement.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CatalogItem, InventoryMovement])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, TypeOrmModule],
})
export class CatalogModule {}
