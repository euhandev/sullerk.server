import { PrismaService } from '@/helper/prisma.service';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Role, Status, User } from '@prisma/client';
import { ApiError } from '@/utils/api_error';
import { BcryptService } from '@/utils/bcrypt.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateUserAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@/config/config.service';
import QueryBuilder from '@/utils/query_builder';
import { userFilterFields, userSearchFields } from './user.constant';
import { IGenericResponse } from '@/interface/common';
import CryptoJS from 'crypto-js';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private readonly configService: ConfigService,
  ) {}

  async createAdmin(data: CreateUserAdminDto): Promise<any | null> {
    const { admin: adminData, ...userData } = data;

    const result = await this.prisma?.$transaction(async (tx) => {
      userData.role = Role.ADMIN;
      console.log(`is email exists`, userData);
      if (!userData.password) {
        userData.password = this.configService.get('DEFAULT_ADMIN_PASSWORD') || 'admin123456';
      }
      userData.password = await this.bcryptService.hash(userData.password);

      const isEmailExists = await tx.user.findUnique({ where: { email: userData.email } });
      if (isEmailExists) {
        throw new ApiError(HttpStatus.CONFLICT, `User email already exists`);
      }

      const userCreation = await tx.user.create({ data: userData });

      const adminCreation = await tx.admin.create({
        data: {
          ...adminData,
          user: { connect: { id: userCreation.id } },
        },
      });

      console.log(`user creation`, userCreation);
      console.log(`see admin creation`, adminCreation);

      if (!userCreation || !adminCreation) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create admin');
      }

      return userCreation;
    });

    return await this.prisma?.user.findUnique({
      where: { id: result.id },
      include: { admin: true },
    });
  }

  async createCustomer(data: CreateCustomerDto): Promise<any | null> {
    const { customer: customerData, ...userData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      userData.role = Role.CUSTOMER;
      if (!userData.password) {
        userData.password = this.configService.get('DEFAULT_CUSTOMER_PASSWORD') || 'customer123456';
      }
      userData.password = await this.bcryptService.hash(userData.password);

      const isEmailExists = await tx.user.findUnique({ where: { email: userData.email } });
      if (isEmailExists) {
        throw new ApiError(HttpStatus.CONFLICT, `User email already exists`);
      }

      const userCreation = await tx.user.create({ data: userData });

      const customerCreation = await tx.customer.create({
        data: {
          ...customerData,
          user: { connect: { id: userCreation.id } },
        },
      });

      if (!userCreation || !customerCreation) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create customer');
      }

      return userCreation;
    });

    return await this.prisma.user.findUnique({
      where: { id: result.id },
      include: { customer: true },
    });
  }

  async getOne(data: { email: string }): Promise<User | any | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.email }],
      },
      omit: { password: true },
      include: {
        admin: true,
        customer: true,
      },
    });

    return result;
  }

  async changeStatus(id: string) {
    const isUserExists = await this.prisma.user.findUnique({ where: { id } });

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        status: isUserExists.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE,
      },
    });
  }

  async getMany(query: Record<string, any>): Promise<IGenericResponse<User[]>> {
    const queryBuilder = new QueryBuilder(query, this.prisma.user);

    const result = await queryBuilder
      .filter(userFilterFields)
      .search(userSearchFields)
      .sort()
      .paginate()
      .fields()
      .omit({ password: true })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async updatePassword({ id, password }: { id: string; password: string }) {
    const isUserExists = await this.prisma.user.findUnique({ where: { id } });

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        password: password,
      },
    });
  }

  // async userNameExists(username: string) {
  //   const isUsernameExists = await this.prisma.user.findUnique({
  //     where: { username },
  //   });

  //   if (isUsernameExists) {
  //     throw new ApiError(
  //       HttpStatus.BAD_REQUEST,
  //       `username is already exists. try a new one !`,
  //     );
  //   }

  //   return isUsernameExists;
  // }
}
