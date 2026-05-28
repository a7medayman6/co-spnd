import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, adapter);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }
  return expressApp;
}

export default async function handler(req: any, res: any) {
  const instance = await bootstrap();
  instance(req, res);
}
