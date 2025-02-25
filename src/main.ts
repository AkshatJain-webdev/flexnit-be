import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  const allowedHosts = app.get(ConfigService).get<string>('ALLOWED_HOSTS')?.split(', ');
  app.enableCors({ origin: allowedHosts ?? 'http://localhost:4200', credentials: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
