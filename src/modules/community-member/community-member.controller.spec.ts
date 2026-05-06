import { Test, TestingModule } from '@nestjs/testing';
import { CommunityMemberController } from './community-member.controller';
import { CommunityMemberService } from './community-member.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityMemberController', () => {
  let controller: CommunityMemberController;

  const mockCommunityMemberService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityMemberController],
      providers: [
        { provide: CommunityMemberService, useValue: mockCommunityMemberService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityMemberController>(CommunityMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
