import { PartialType } from '@nestjs/swagger';
import { CreateCommunityCommentDto } from './create-community-comment.dto';

export class UpdateCommunityCommentDto extends PartialType(
  CreateCommunityCommentDto,
) {}
