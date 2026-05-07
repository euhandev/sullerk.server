import { PartialType } from '@nestjs/swagger';
import { CreateCommunityRepostDto } from './create-community-repost.dto';

export class UpdateCommunityRepostDto extends PartialType(CreateCommunityRepostDto) {}
