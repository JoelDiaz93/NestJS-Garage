import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { envBoolean } from './config/env.validation';
import { ConfiguredSocketIoAdapter } from './realtime/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get('API_PREFIX', 'api/v1');
  const origins = String(config.get('CORS_ORIGIN', 'http://localhost:5173'))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.setGlobalPrefix(prefix);
  app.enableCors({ origin: origins, credentials: true });
  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app, origins));
  app.enableShutdownHooks();
  app.use((_req: unknown, res: { setHeader(name: string, value: string): void }, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  if (envBoolean(config.get('SWAGGER_ENABLED'), true)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GarageFlow API')
      .setDescription('Gestión de taller: clientes, vehículos, inventario, cotizaciones, órdenes y evidencias')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  console.log(`GarageFlow running on http://localhost:${port}/${prefix}`);
}

bootstrap();
