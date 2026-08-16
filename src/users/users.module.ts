import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RefreshToken } from '../auth/refresh-token.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({ imports: [TypeOrmModule.forFeature([User, RefreshToken]), forwardRef(() => AuthModule)], controllers: [UsersController], providers: [UsersService], exports: [UsersService, TypeOrmModule] })
export class UsersModule {}
