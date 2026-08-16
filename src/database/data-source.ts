import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const ssl = String(process.env.DB_SSL ?? 'false').toLowerCase() === 'true';
const databaseUrl = process.env.DATABASE_URL?.trim();

const connection = databaseUrl
  ? { url: databaseUrl }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    };

const options: DataSourceOptions = {
  type: 'postgres',
  ...connection,
  ssl: ssl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'garageflow_migrations',
  extra: {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    connectionTimeoutMillis: 10_000,
  },
};

export default new DataSource(options);
