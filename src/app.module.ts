import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientsModule } from './clients/clients.module';
import { envBoolean, validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { QuotesModule } from './quotes/quotes.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const connection = databaseUrl
          ? { url: databaseUrl }
          : {
              host: config.getOrThrow<string>('DB_HOST'),
              port: Number(config.get('DB_PORT', 5432)),
              database: config.getOrThrow<string>('DB_NAME'),
              username: config.getOrThrow<string>('DB_USERNAME'),
              password: config.getOrThrow<string>('DB_PASSWORD'),
            };

        return {
          type: 'postgres' as const,
          ...connection,
          autoLoadEntities: true,
          synchronize: envBoolean(config.get('DB_SYNC'), false),
          migrationsRun: envBoolean(config.get('DB_MIGRATIONS_RUN'), false),
          migrations: [__dirname + '/database/migrations/*{.js,.ts}'],
          ssl: envBoolean(config.get('DB_SSL'), false) ? { rejectUnauthorized: false } : false,
          extra: {
            max: Number(config.get('DB_POOL_MAX', 5)),
            connectionTimeoutMillis: 10_000,
          },
        };
      },
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    VehiclesModule,
    CatalogModule,
    QuotesModule,
    WorkOrdersModule,
    RealtimeModule,
    MediaModule,
    HealthModule,
    SeedModule,
  ],
})
export class AppModule {}
