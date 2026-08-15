import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { CatalogItem } from './catalog-item.entity'; import { CatalogController } from './catalog.controller'; import { CatalogService } from './catalog.service';
@Module({imports:[AuthModule,TypeOrmModule.forFeature([CatalogItem])],controllers:[CatalogController],providers:[CatalogService],exports:[CatalogService,TypeOrmModule]}) export class CatalogModule{}
