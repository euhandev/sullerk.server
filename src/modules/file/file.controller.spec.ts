import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService as FileServiceProvider } from '@/helper/file.service';
import { ConfigService } from '@/config/config.service';
import { ConfigService as NestConfigService } from '@nestjs/config';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

describe('FileController', () => {
  let controller: FileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        FileService,
        PrismaService,
        FileServiceProvider,
        ConfigService,
        NestConfigService,
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
