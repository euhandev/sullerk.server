import { Test, TestingModule } from '@nestjs/testing';
import { CommunityPostController } from './community-post.controller';
import { CommunityPostService } from './community-post.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityPostController', () => {
  let controller: CommunityPostController;

  const mockCommunityPostService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityPostController],
      providers: [
        { provide: CommunityPostService, useValue: mockCommunityPostService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityPostController>(CommunityPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
