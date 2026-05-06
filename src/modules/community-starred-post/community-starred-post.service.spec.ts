import { Test, TestingModule } from '@nestjs/testing';
import { CommunityStarredPostService } from './community-starred-post.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityStarredPostService', () => {
  let service: CommunityStarredPostService;

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityStarredPostService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommunityStarredPostService>(CommunityStarredPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
