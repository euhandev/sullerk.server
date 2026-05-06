import { Test, TestingModule } from '@nestjs/testing';
import { CommunityCommentController } from './community-comment.controller';
import { CommunityCommentService } from './community-comment.service';
import { PrismaService } from '@/helper/prisma.service';

describe('CommunityCommentController', () => {
  let controller: CommunityCommentController;

  const mockCommunityCommentService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityCommentController],
      providers: [
        { provide: CommunityCommentService, useValue: mockCommunityCommentService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<CommunityCommentController>(CommunityCommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
