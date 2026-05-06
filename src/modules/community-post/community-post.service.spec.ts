import { Test, TestingModule } from '@nestjs/testing';
import { CommunityPostService } from './community-post.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

describe('CommunityPostService', () => {
  let service: CommunityPostService;

  const mockPrismaService = {};
  const mockFileService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityPostService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<CommunityPostService>(CommunityPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
