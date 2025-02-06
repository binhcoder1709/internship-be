import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* set global prefix */
  app.setGlobalPrefix('api/v1');
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: ["1"],
  // });

  /* enable cors */
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /* serve static files */
  app.useStaticAssets('public');

  /* global validation pipe */
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  /* swagger */
  const config = new DocumentBuilder()
    .setTitle('Your API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    deepScanRoutes: true
  });
  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
      defaultModelExpandDepth: 3,
      defaultModelsExpandDepth: 3,
      defaultModelRendering: 'model',
      showExtensions: true,
      showCommonExtensions: true,
      withCredentials: true
    },
    explorer: true,
    customSiteTitle: 'Rikkei API Documentation'
  });

  /* start app and port */
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
