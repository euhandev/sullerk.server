import { AppModule } from '@/app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { ConfigService } from './config/config.service';
import { FilteredLogger } from './utils/logger';
import * as fs from 'fs';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new FilteredLogger('oaktree', {
      logLevels: ['log', 'warn', 'error', 'debug', 'verbose'],
      ignorePatterns: [
        'InstanceLoader',
        'WebSocketsController',
        'RouterExplorer',
        'RoutesResolver',
      ],
    }),
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 5000;

  app.use(
    session({
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        // secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600_000,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://keepsake-memorabilia.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Sullerk Api Documentation')
    .setDescription('API documentation for Sullerk platform')
    .setVersion('1.0.0')
    .setContact('Euhan Sarkar', 'https://github.com/euhandev', 'euhan.dev@gmail.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name must match @ApiBearerAuth('JWT-auth')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  try {
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  } catch (error) {
    console.warn(`Could not save swagger-spec.json to disk: ${error.message}`);
  }

  // 🌐 Server Starting
  console.log('🌐 Starting oaktree API Server...');
  console.log('📦 Loading modules...');

  // 🛜 CORS Configuration
  console.log('🛡️  CORS: Enabled for frontend origins');

  // 📚 API Documentation
  console.log('📚 Swagger: Available at /api');

  // 🚀 Final Startup
  await app.listen(port);
  console.log(`\n🚀 Server launched successfully!`);
  console.log(`🔗 Application is running on: ${await app.getUrl()}`);
  console.log(`📦 API Prefix: /api/v1`);
  console.log(`📄 Docs: ${await app.getUrl()}/api\n`);

  // // 💡 Quick Tips
  // console.log('💡 Tips:');
  // console.log('   • Meilisearch provides instant location suggestions');
  // console.log('   • Use POST /locations/suggestions?q=sod for auto-complete');
  // console.log('   • Swagger docs include all endpoints with examples\n');
}

bootstrap();
