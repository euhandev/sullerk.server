import { Test, TestingModule } from '@nestjs/testing';
import { CommunityRepostController } from './community-repost.controller';
import { CommunityRepostService } from './community-repost.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityRepostController', () => {
  let controller: CommunityRepostController;

  const mockCommunityRepostService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityRepostController],
      providers: [
        { provide: CommunityRepostService, useValue: mockCommunityRepostService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityRepostController>(CommunityRepostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
