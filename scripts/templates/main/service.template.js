export const serviceTemplate = ({
  pascal,
  camel,
  kebab,
}) => `import { HttpStatus, Injectable } from '@nestjs/common';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  ${camel}FilterFields,
  ${camel}Include,
  ${camel}NestedFilters,
  ${camel}SearchFields,
} from './${kebab}.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class ${pascal}Service {
  constructor(private prisma: PrismaService) {}

  async create(paylaod: Create${pascal}Dto) {
    return await this.prisma.${camel}.create({
      data: paylaod,
    });
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string)
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.${camel});
    const result = await queryBuilder

      .filter(${camel}FilterFields)
      .search(${camel}SearchFields)
      .nestedFilter(${camel}NestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(${camel}Include)
      .rawFilter({
       
      })
      .populate(populateFields)
      // .getAllQueries()
      .execute();
 

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {

    const is${pascal}Exists = await this.prisma.${camel}.findUnique({
        where: { id },
    });
  
      if (!is${pascal}Exists) {
        throw new ApiError(HttpStatus.NOT_FOUND, "${camel} not found");
      }

    return await this.prisma.${camel}.findUnique({
      where: { id },
    });
  }

  async update(id: string, paylaod: Update${pascal}Dto) {
    const isExist = await this.findOne(id);
    if(!isExist){
      throw new ApiError(HttpStatus.NOT_FOUND, "${camel} not found with this id:"+ id)
    }
    return await this.prisma.${camel}.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(id: string) {
    const isExist = await this.findOne(id);
    if(!isExist){
      throw new ApiError(HttpStatus.NOT_FOUND, "${camel} not found with this id:"+ id)
    }
    return await this.prisma.${camel}.delete({
      where: { id },
    });
  }
}
`;
