import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { ClientsModule } from '../clients/clients.module'; import { Vehicle } from './vehicle.entity'; import { VehiclesController } from './vehicles.controller'; import { VehiclesService } from './vehicles.service';
@Module({ imports:[AuthModule,TypeOrmModule.forFeature([Vehicle]),ClientsModule],controllers:[VehiclesController],providers:[VehiclesService],exports:[VehiclesService,TypeOrmModule]}) export class VehiclesModule {}
