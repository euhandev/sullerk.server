import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { AdminDto } from '@/modules/admin/dto/create-admin.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserAdminDto extends CreateUserDto {
  @ApiProperty({ type: AdminDto })
  @ValidateNested()
  @Type(() => AdminDto)
  admin: AdminDto;
}
