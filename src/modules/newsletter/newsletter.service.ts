import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  newsletterFilterFields,
  newsletterInclude,
  newsletterNestedFilters,
  newsletterSearchFields,
} from './newsletter.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async create(payload: CreateNewsletterDto) {
    const { email, AdvisorId } = payload;

    const existing = await this.prisma.newsletter.findUnique({
      where: {
        email_AdvisorId: { email, AdvisorId },
      },
    });

    if (existing) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'This email is already subscribed to the Advisor newsletter.',
      );
    }

    const newsletter = await this.prisma.newsletter.create({
      data: payload,
    });

    return newsletter;
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.newsletter);
    const result = await queryBuilder

      .filter(newsletterFilterFields)
      .search(newsletterSearchFields)
      .nestedFilter(newsletterNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(newsletterInclude)
      .rawFilter({})
      .populate(populateFields)
      // .getAllQueries()
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isNewsletterExists = await this.prisma.newsletter.findUnique({
      where: { id },
    });

    if (!isNewsletterExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'newsletter not found');
    }

    return await this.prisma.newsletter.findUnique({
      where: { id },
    });
  }

  async update(id: string, paylaod: UpdateNewsletterDto) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'newsletter not found with this id:' + id);
    }
    return await this.prisma.newsletter.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(id: string) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'newsletter not found with this id:' + id);
    }
    return await this.prisma.newsletter.delete({
      where: { id },
    });
  }
}
