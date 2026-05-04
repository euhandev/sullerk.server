import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('KSMM Api Documentation')
    .setDescription('API documentation')
    .setVersion('0.0.1')
    .setContact('Euhan Sarkar', 'https://github.com/euhandev', 'euhan.dev@gmail.com')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));
  await app.close();
  process.exit(0);
}

generateSwagger().catch((err) => {
  console.error(err);
  process.exit(1);
});
