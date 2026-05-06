import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

describe('CommunityService', () => {
  let service: CommunityService;

  const mockPrismaService = {};
  const mockFileService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
