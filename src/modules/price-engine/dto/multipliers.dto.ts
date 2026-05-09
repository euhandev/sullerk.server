import { ProofType, ProofViewKey, SignatureKey, AuthCompanyKey } from '@prisma/client';
import { IsEnum, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProofRuleDto {
  @ApiProperty({ enum: ProofViewKey })
  @IsEnum(ProofViewKey)
  viewKey: ProofViewKey;

  @ApiProperty()
  @IsNumber()
  multiplier: number;
}

export class ProofGroupDto {
  @ApiProperty({ enum: ProofType })
  @IsEnum(ProofType)
  proofType: ProofType;

  @ApiProperty({ type: [ProofRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofRuleDto)
  rules: ProofRuleDto[];
}

export class SignatureMultiplierDto {
  @ApiProperty({ enum: SignatureKey })
  @IsEnum(SignatureKey)
  signatureKey: SignatureKey;

  @ApiProperty()
  @IsNumber()
  multiplier: number;
}

export class AuthMultiplierDto {
  @ApiProperty({ enum: AuthCompanyKey })
  @IsEnum(AuthCompanyKey)
  companyKey: AuthCompanyKey;

  @ApiProperty()
  @IsNumber()
  multiplier: number;
}

export class UpdateMultipliersDto {
  @ApiPropertyOptional({ type: [ProofGroupDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofGroupDto)
  proofGroups?: ProofGroupDto[];

  @ApiPropertyOptional({ type: [SignatureMultiplierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignatureMultiplierDto)
  signatures?: SignatureMultiplierDto[];

  @ApiPropertyOptional({ type: [AuthMultiplierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthMultiplierDto)
  auths?: AuthMultiplierDto[];
}
