import { Test, TestingModule } from '@nestjs/testing';
import { CommunityMemberService } from './community-member.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityMemberService', () => {
  let service: CommunityMemberService;

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityMemberService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommunityMemberService>(CommunityMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
