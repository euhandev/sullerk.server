import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Blog } from '@prisma/client';

describe('BlogService', () => {
  let service: BlogService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    blog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockFileService = {
    deleteFromDigitalOcean: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a blog with a unique slug', async () => {
      const createBlogDto: CreateBlogDto = {
        name: 'Test Blog',
        writer: 'John Doe',
        description: 'Test Description',
      };

      // Mock findFirst to return null (no existing slug)
      (prismaService.blog.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.blog.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...createBlogDto,
        slug: 'test-blog',
      });

      const result = await service.create(createBlogDto);

      expect(prismaService.blog.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-blog' },
      });
      expect(prismaService.blog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: 'test-blog' }),
      });
      expect(result).toEqual(expect.objectContaining({ slug: 'test-blog' }));
    });

    it('should append a suffix if slug already exists', async () => {
      const createBlogDto: CreateBlogDto = {
        name: 'Test Blog',
        writer: 'John Doe',
        description: 'Test Description',
      };

      // Mock findFirst to return true for 'test-blog', then null for 'test-blog-1'
      (prismaService.blog.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing' } as Blog) // test-blog exists
        .mockResolvedValueOnce(null); // test-blog-1 does not exist

      (prismaService.blog.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...createBlogDto,
        slug: 'test-blog-1',
      });

      const result = await service.create(createBlogDto);

      expect(prismaService.blog.findFirst).toHaveBeenCalledTimes(2);
      expect(prismaService.blog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: 'test-blog-1' }),
      });
      expect(result).toEqual(expect.objectContaining({ slug: 'test-blog-1' }));
    });
  });
});
