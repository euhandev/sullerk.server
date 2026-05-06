import { Test, TestingModule } from '@nestjs/testing';
import { CommunityCommentService } from './community-comment.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

describe('CommunityCommentService', () => {
  let service: CommunityCommentService;

  const mockPrismaService = {};
  const mockFileService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityCommentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<CommunityCommentService>(CommunityCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
