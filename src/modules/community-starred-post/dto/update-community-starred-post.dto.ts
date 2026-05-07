import { PartialType } from '@nestjs/swagger';
import { CreateCommunityStarredPostDto } from './create-community-starred-post.dto';

export class UpdateCommunityStarredPostDto extends PartialType(CreateCommunityStarredPostDto) {}
