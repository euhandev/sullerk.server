import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { UpdateAdminDto } from './dto/update-admin.dto';
import QueryBuilder from '@/utils/query_builder';
import {
  adminFilterFields,
  adminInclude,
  adminNestedFilters,
  adminRangeFilter,
  adminSearchFields,
} from './admin.constant';
import { FileService } from '@/helper/file.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async findAll(query: Record<string, any>): Promise<IGenericResponse<User[]>> {
    const queryBuilder = new QueryBuilder(query, this.prisma.user);
    const result = await queryBuilder

      .filter(adminFilterFields)
      .search(adminSearchFields)
      .nestedFilter(adminNestedFilters)
      .sort()
      .paginate()
      .include(adminInclude)
      .fields()
      .filterByRange(adminRangeFilter)
      .omit({ password: true })
      .rawFilter({ role: Role.ADMIN })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isAdminExists = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!isAdminExists) {
      isAdminExists = await this.prisma.admin.findUnique({
        where: { userId: id },
      });
    }

    if (!isAdminExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Admin Not Found');
    }

    const result = await this.prisma.user.findUnique({
      where: { id: isAdminExists?.userId },
      omit: { password: true },
      include: { admin: true },
    });

    return result;
  }

  async update(id: string, data: UpdateAdminDto, avatar: string) {
    const { admin, ...user } = data;

    const isUserExists = await this.findOne(id);

    const result = await this.prisma.$transaction(
      async (tx) => {
        if (user?.email) {
          const isEmailExists = await tx.user.findUnique({
            where: { email: user?.email, NOT: { id } },
          });

          if (isEmailExists) {
            throw new ApiError(HttpStatus.CONFLICT, `user email is already exists`);
          }
        }

        // if (user.contactNo) {
        //   const isContactNoExists = await tx.user.findUnique({
        //     where: { contactNo: user?.contactNo, NOT: { id } },
        //   });

        //   if (isContactNoExists) {
        //     throw new ApiError(
        //       HttpStatus.CONFLICT,
        //       `contact no is already exists`,
        //     );
        //   }
        // }

        const adminUpdation = await this.prisma.admin.update({
          where: { id: isUserExists?.admin?.id },
          data: { ...(admin as any) },
        });

        if (!adminUpdation) {
          throw new ApiError(HttpStatus.NOT_FOUND, `admin updation failed`);
        }

        if (isUserExists?.avatar && avatar) {
          await this.fileService.deleteFromCloudinary(isUserExists?.avatar);
        }

        delete user.role;
        delete user.status;

        const userUpdation = await this.prisma.user.update({
          where: { id: isUserExists?.id },
          data: { ...user, ...(avatar ? { avatar } : {}) },
        });

        if (!userUpdation) {
          throw new ApiError(HttpStatus.NOT_FOUND, `user updated`);
        }
        return userUpdation;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return await this.prisma.user.findUnique({
      where: { id: result?.id },
      include: { admin: true },
    });
  }

  async remove(id: string) {
    const isUserExists = await this.findOne(id);

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    await this.prisma.$transaction(
      async (tx) => {
        await this.prisma.admin.delete({
          where: { id: isUserExists?.admin.id },
        });

        const userDeletion = await tx.user.delete({
          where: { id: isUserExists.id },
        });
        return userDeletion;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return 'user deleted successfully';
  }
}
