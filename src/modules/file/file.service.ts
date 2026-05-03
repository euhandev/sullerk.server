import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  fileFilterFields,
  // fileInclude,
  fileNestedFilters,
  fileSearchFields,
} from './file.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { Prisma } from '@prisma/client';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async create(createFileDto: CreateFileDto) {

    return await this.prisma.file.create({
      data: createFileDto,
    });
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.file);
    const result = await queryBuilder

      .filter(fileFilterFields)
      .search(fileSearchFields)
      .nestedFilter(fileNestedFilters)
      .sort()
      .paginate()
      .fields()
      // .include(fileInclude)
      .rawFilter({})
      .populate(populateFields)
      // .getAllQueries()
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    return await this.prisma.file.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateFileDto: UpdateFileDto) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'file not found with this id:' + id);
    }
    return await this.prisma.file.update({
      where: { id },
      data: updateFileDto,
    });
  }

  async remove(id: string) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'file not found with this id:' + id);
    }
    return await this.prisma.file.delete({
      where: { id },
    });
  }
  async removeMany(deleteWhereInput: Prisma.FileDeleteManyArgs) {
    return await this.prisma.file.deleteMany(deleteWhereInput);
  }
}
