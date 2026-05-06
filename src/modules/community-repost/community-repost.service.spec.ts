import { Test, TestingModule } from '@nestjs/testing';
import { CommunityRepostService } from './community-repost.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityRepostService', () => {
  let service: CommunityRepostService;

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityRepostService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommunityRepostService>(CommunityRepostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
