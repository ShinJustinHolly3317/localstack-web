import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cors from 'cors';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.use(cors());
  
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Serve static files from React build (if present)
  const clientDist = join(__dirname, '..', 'client', 'dist');
  app.useStaticAssets(clientDist);
  
  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // SPA fallback for non-API routes
  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.get('*', (req, res, next) => {
    if (req.path && typeof req.path === 'string' && req.path.startsWith('/api')) {
      return next();
    }
    try {
      return res.sendFile(join(clientDist, 'index.html'));
    } catch (e) {
      return next();
    }
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap(); 