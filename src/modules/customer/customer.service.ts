import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Customer, Role } from '@prisma/client';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import QueryBuilder from '@/utils/query_builder';
import {
  customerFilterFields,
  customerInclude,
  customerNestedFilters,
  customerRangeFilter,
  customerSearchFields,
} from './customer.constant';
import { FileService } from '@/helper/file.service';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async findAll(query: Record<string, any>): Promise<IGenericResponse<Customer[]>> {
    const queryBuilder = new QueryBuilder(query, this.prisma.user);
    const result = await queryBuilder

      .filter(customerFilterFields)
      .search(customerSearchFields)
      .nestedFilter(customerNestedFilters)
      .sort()
      .paginate()
      .include(customerInclude)
      .fields()
      .filterByRange(customerRangeFilter)
      .omit({ password: true })
      .rawFilter({ role: Role.CUSTOMER })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isCustomerExists = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!isCustomerExists) {
      isCustomerExists = await this.prisma.customer.findUnique({
        where: { userId: id },
      });
    }

    if (!isCustomerExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer Not Found');
    }

    return await this.prisma.user.findUnique({
      where: { id: isCustomerExists?.userId },
      omit: { password: true },
      include: { customer: true },
    });
  }

  async update(id: string, data: UpdateCustomerDto, avatar?: string) {
    const { customer: customerData, ...userData } = data;

    const isUserExists = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      const CustomerUpdation = await tx.customer.update({
        where: { id: isUserExists?.customer?.id },
        data: customerData as any,
      });

      if (!CustomerUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `Customer updation failed`);
      }

      if (isUserExists?.avatar && avatar) {
        await this.fileService.deleteFromCloudinary(isUserExists?.avatar);
      }

      delete userData.role;
      delete userData.status;

      const userUpdation = await this.prisma.user.update({
        where: { id: isUserExists?.id },
        data: { ...userData, ...(avatar ? { avatar } : {}) },
      });

      if (!userUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `user updated`);
      }
      return userUpdation;
    });

    return await this.prisma.user.findUnique({
      where: { id: isUserExists?.id },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    const isUserExists = await this.findOne(id);

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.customer.delete({
          where: { id: isUserExists?.customer.id },
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
