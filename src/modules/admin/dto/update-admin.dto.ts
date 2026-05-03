import { CreateUserAdminDto } from '@/modules/user/dto/create-admin.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAdminDto extends PartialType(CreateUserAdminDto) {}
