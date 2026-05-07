import { PartialType } from '@nestjs/swagger';
import { CreateCommunityMemberDto } from './create-community-member.dto';

export class UpdateCommunityMemberDto extends PartialType(CreateCommunityMemberDto) {}
