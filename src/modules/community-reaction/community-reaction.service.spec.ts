import { Test, TestingModule } from '@nestjs/testing';
import { CommunityReactionService } from './community-reaction.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityReactionService', () => {
  let service: CommunityReactionService;

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityReactionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommunityReactionService>(CommunityReactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
