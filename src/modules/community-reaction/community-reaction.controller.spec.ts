import { Test, TestingModule } from '@nestjs/testing';
import { CommunityReactionController } from './community-reaction.controller';
import { CommunityReactionService } from './community-reaction.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityReactionController', () => {
  let controller: CommunityReactionController;

  const mockCommunityReactionService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityReactionController],
      providers: [
        { provide: CommunityReactionService, useValue: mockCommunityReactionService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityReactionController>(CommunityReactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
