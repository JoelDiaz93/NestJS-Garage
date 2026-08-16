import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogItem } from '../catalog/catalog-item.entity';
import { InventoryMovement } from '../catalog/entities/inventory-movement.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CatalogItem, InventoryMovement])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
