
import { ApiProperty } from '@nestjs/swagger';
import { CommunityMemberStatus, CommunityUserType } from '@prisma/client';
import { IsEnum, IsMongoId, IsString } from 'class-validator';

export class CreateCommunityMemberDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  communityId: string;

  @ApiProperty({ enum: CommunityUserType })
  @IsEnum(CommunityUserType)
  userType: CommunityUserType = CommunityUserType.MEMBER;

  @ApiProperty({ enum: CommunityMemberStatus })
  @IsEnum(CommunityMemberStatus)
  status: CommunityMemberStatus = CommunityMemberStatus.ACTIVE;
}
