import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostDeletedEvent } from './post.listener';
import { PrismaService } from '@/helper/prisma.service';
import { CreatePostDto, FileItem } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileService as HelperFileService } from '@/helper/file.service';
import { ApiError } from '@/utils/api_error';
import { FileAs, FileContext, FileModule, ReactionType } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: HelperFileService,
    private readonly eventEmitter: EventEmitter2,
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
        module: FileModule.POST,
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
      where: { id, uploadedById: userId, isPending: true, module: FileModule.POST },
    });
    if (!file) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'File not found or not authorized');
    }
    await this.fileService.deleteFromCloudinary(file.url, file.key);
    await this.prisma.file.delete({ where: { id } });
    return { success: true };
  }

  /**
   * React to a post (Toggle logic)
   */
  async reactToPost(postId: string, type: ReactionType, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');

    const existingReaction = await this.prisma.reaction.findFirst({
      where: { postId, reactedById: customer.id },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off if same type
        await this.prisma.reaction.delete({ where: { id: existingReaction.id } });
        return { action: 'REMOVED', type };
      } else {
        // Update to new type
        const updated = await this.prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return { action: 'UPDATED', type: updated.type };
      }
    }

    const created = await this.prisma.reaction.create({
      data: {
        postId,
        reactedById: customer.id,
        type,
      },
    });

    return { action: 'CREATED', type: created.type };
  }

  /**
   * Share (Repost) a post
   */
  async sharePost(postId: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');

    // Create a Repost record
    return await this.prisma.repost.create({
      data: {
        postId,
        reportedById: customer.id,
      },
    });
  }

  /**
   * Update a post
   */
  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const { images, poll, pollExpiresAt, ...postData } = updatePostDto;

    // 1. Verify ownership
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');
    if (post.customer.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You can only edit your own posts');
    }

    // 2. Resolve files (if provided)
    let resolvedImages = post.images as any;
    let allResolvedIds: string[] = [];

    if (images) {
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

      resolvedImages = await resolveFiles(images);
      allResolvedIds = resolvedImages.map((f: any) => f.fileId);
    }

    // 3. Update in transaction
    return await this.prisma.$transaction(async (tx) => {
      const updatedPost = await tx.post.update({
        where: { id },
        data: {
          ...postData,
          images: resolvedImages,
          ...(pollExpiresAt && { pollExpiresAt: new Date(pollExpiresAt) }),
        },
        include: {
          pollOptions: true,
          customer: true,
          listing: true,
        },
      });

      // 4. Update file records (Activate new files)
      if (allResolvedIds.length > 0) {
        await tx.file.updateMany({
          where: {
            id: { in: allResolvedIds },
            uploadedById: userId,
            isPending: true,
          },
          data: {
            postId: updatedPost.id,
            isPending: false,
          },
        });
      }

      return updatedPost;
    });
  }

  /**
   * Delete a post (with cascade and background media cleanup)
   */
  async remove(id: string, userId: string) {
    // 1. Verify ownership
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        customer: true,
        files: true, // These are the files linked to the post
      },
    });

    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');
    if (post.customer.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You can only delete your own posts');
    }

    // 2. Prepare file info for background cleanup
    const filesToCleanup = post.files.map((f) => ({ url: f.url, key: f.key }));

    // 3. Delete Post (Prisma triggers cascade delete for relations)
    const deletedPost = await this.prisma.post.delete({
      where: { id },
    });

    // 4. Emit background event for Cloudinary cleanup
    if (filesToCleanup.length > 0) {
      this.eventEmitter.emit('post.deleted', new PostDeletedEvent(filesToCleanup));
    }

    return deletedPost;
  }

  /**
   * Get all posts with engagement metrics
   */
  async findAll(userId?: string) {
    return await this.prisma.post.findMany({
      include: {
        customer: {
          select: {
            fullName: true,
            user: { select: { avatar: true } },
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            reports: true,
          },
        },
        // If we have a userId, we can check if the current user reacted
        ...(userId && {
          reactions: {
            where: { customer: { userId } },
            select: { type: true },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
