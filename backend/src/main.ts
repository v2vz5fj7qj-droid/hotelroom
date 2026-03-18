import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Désactiver le body parser intégré pour pouvoir définir notre propre limite
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Limite 20 Mo pour les uploads base64 (logos, images de substitution)
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application démarrée sur http://localhost:${port}`);
}
bootstrap();
