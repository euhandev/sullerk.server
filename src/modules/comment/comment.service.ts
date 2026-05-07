import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');

    return await this.prisma.comment.create({
      data: {
        body: dto.body,
        postId: dto.postId,
        customerId: customer.id,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            user: { select: { avatar: true } },
          },
        },
      },
    });
  }

  async findByPost(postId: string) {
    return await this.prisma.comment.findMany({
      where: { postId },
      include: {
        customer: {
          select: {
            fullName: true,
            user: { select: { avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found');
    if (comment.customerId !== customer?.id) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You can only delete your own comments');
    }

    return await this.prisma.comment.delete({ where: { id } });
  }
}
