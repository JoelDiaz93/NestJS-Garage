import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);
  app.enableCors({ origin: config.get('CORS_ORIGIN', '*') });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GarageFlow API')
    .setDescription('Gestión de taller: clientes, vehículos, inventario, servicios, cotizaciones y órdenes de trabajo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`GarageFlow running on http://localhost:${port}/${prefix}`);
}
bootstrap();
