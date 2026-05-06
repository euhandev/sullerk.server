import { Test, TestingModule } from '@nestjs/testing';
import { CommunityStarredPostController } from './community-starred-post.controller';
import { CommunityStarredPostService } from './community-starred-post.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityStarredPostController', () => {
  let controller: CommunityStarredPostController;

  const mockCommunityStarredPostService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityStarredPostController],
      providers: [
        { provide: CommunityStarredPostService, useValue: mockCommunityStarredPostService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityStarredPostController>(CommunityStarredPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
