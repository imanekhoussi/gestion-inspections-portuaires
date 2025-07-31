// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS
  app.enableCors({
    origin: ['http://localhost:4200'], // Frontend Angular
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('API Gestion Inspections Portuaires')
    .setDescription('API pour la gestion des inspections des actifs portuaires')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('🚀 Backend démarré sur http://localhost:3000');
  console.log('📚 Documentation API: http://localhost:3000/api');
}
bootstrap();
