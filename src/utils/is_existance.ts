import { Injectable, HttpStatus } from '@nestjs/common';
import { ApiError } from '@/utils/api_error';
import { PrismaService } from '@/helper/prisma.service';
import { PrismaClient } from '@prisma/client';

type ModelDelegate = {
  findUnique: (args: any) => Promise<any>;
};

type PrismaModelKeys = {
  [K in keyof PrismaClient]: PrismaClient[K] extends ModelDelegate ? K : never;
}[keyof PrismaClient];

@Injectable()
export class PrismaHelperService {
  constructor(private readonly prisma: PrismaService) {}

  async validateEntityExistence<T>(
    model: PrismaModelKeys,
    id: string,
    notFoundMessage = 'Resource not found',
  ): Promise<T> {
    const delegate = this.prisma[model] as unknown as ModelDelegate;
    const entity = await delegate.findUnique({ where: { id } });

    if (!entity) {
      throw new ApiError(HttpStatus.NOT_FOUND, notFoundMessage);
    }

    return entity;
  }
}
