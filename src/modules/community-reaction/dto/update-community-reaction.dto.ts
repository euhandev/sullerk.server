import { PartialType } from '@nestjs/swagger';
import { CreateCommunityReactionDto } from './create-community-reaction.dto';

export class UpdateCommunityReactionDto extends PartialType(CreateCommunityReactionDto) {}
