import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreatePostDto, FileItem } from './dto/create-post.dto';
import { FileService as HelperFileService } from '@/helper/file.service';
import { ApiError } from '@/utils/api_error';
import { FileAs, FileContext } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: HelperFileService,
  ) {}

  /**
   * Upload single media file for post
   */
  async uploadMedia(
    file: any,
    purpose: FileAs,
    userId: string,
    context: FileContext = FileContext.CREATE,
  ) {
    if (!file) return null;

    // Posts usually use a dedicated folder
    const folder = `posts/${purpose.toLowerCase()}`;

    const { url, key } = await this.fileService.autoUpload(file, folder);

    return await this.prisma.file.create({
      data: {
        url,
        key,
        name: file.originalname,
        purpose: purpose,
        uploadedById: userId,
        isPending: true,
        context: context,
      },
    });
  }

  /**
   * Create post with rich content
   */
  async create(createPostDto: CreatePostDto, userId: string) {
    const { images, poll, ...postData } = createPostDto;

    // 1. Validate customer
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');
    }

    // 2. Resolve files
    const resolveFiles = async (items: FileItem[]) => {
      if (!items?.length) return [];
      const allUserFiles = await this.prisma.file.findMany({
        where: { uploadedById: userId },
      });
      const uniqueResults = new Map<string, { fileId: string; url: string }>();
      for (const item of items) {
        const file = allUserFiles.find((f) => f.id === item.fileId || f.url === item.url);
        if (file && !uniqueResults.has(file.id)) {
          uniqueResults.set(file.id, { fileId: file.id, url: file.url });
        }
      }
      return Array.from(uniqueResults.values());
    };

    const resolvedImages = await resolveFiles(images || []);
    const allResolvedIds = resolvedImages.map((f) => f.fileId);

    // 3. Create Post in transaction
    return await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          description: postData.description,
          externalLink: postData.externalLink,
          listingId: postData.listingId,
          customerId: customer.id,
          images: resolvedImages,
          // Poll creation
          ...(poll && {
            pollQuestion: poll.question,
            pollExpiresAt: poll.expiresAt ? new Date(poll.expiresAt) : null,
            pollMultipleChoice: poll.multipleChoice || false,
            pollOptions: {
              create: poll.options.map((opt) => ({
                text: opt.text,
              })),
            },
          }),
        },
        include: {
          pollOptions: true,
          customer: true,
          listing: true,
        },
      });

      // 4. Update file records
      if (allResolvedIds.length > 0) {
        await tx.file.updateMany({
          where: {
            id: { in: allResolvedIds },
            uploadedById: userId,
            isPending: true,
          },
          data: {
            postId: post.id,
            isPending: false,
          },
        });
      }

      return post;
    });
  }

  async deletePendingFile(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, uploadedById: userId, isPending: true },
    });
    if (!file) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'File not found or not authorized');
    }
    await this.fileService.deleteFromCloudinary(file.url, file.key);
    await this.prisma.file.delete({ where: { id } });
    return { success: true };
  }
}
