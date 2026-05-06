import { Test, TestingModule } from '@nestjs/testing';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

describe('CommunityController', () => {
  let controller: CommunityController;

  const mockCommunityService = {};
  const mockPrismaService = {};
  const mockFileService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [
        { provide: CommunityService, useValue: mockCommunityService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    controller = module.get<CommunityController>(CommunityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
