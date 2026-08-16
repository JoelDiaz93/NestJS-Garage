import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function run() {
  if (String(process.env.SEED_ENABLED ?? 'false').toLowerCase() !== 'true') {
    console.log('Seed disabled; skipping.');
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const result = await app.get(SeedService).run();
    console.log(result);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
