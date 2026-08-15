import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { Client } from './client.entity'; import { ClientsController } from './clients.controller'; import { ClientsService } from './clients.service';
@Module({ imports: [AuthModule, TypeOrmModule.forFeature([Client])], controllers: [ClientsController], providers: [ClientsService], exports: [ClientsService, TypeOrmModule] }) export class ClientsModule {}
