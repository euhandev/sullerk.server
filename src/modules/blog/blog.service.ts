/* eslint-disable @typescript-eslint/no-unused-vars */
import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Blog } from '@prisma/client';
import slugify from 'slugify';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { blogFilterFields, blogSearchFields } from './blog.constant';

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: CreateBlogDto) {
    let slug = data.slug;
    if (!slug) {
      slug = await this.generateUniqueSlug(data.name);
    } else {
      // If slug provided, strictly check or generate unique?
      // Usually if explicit slug is provided, we might want to enforce uniqueness or error.
      // But to be "similar to Course/Category" which auto-generates:
      // CourseService checks: if (!payload.slug) generateUnique(name) else generateUnique(slug)
      slug = await this.generateUniqueSlug(slug);
    }

    return this.prisma.blog.create({
      data: { ...data, slug },
    });
  }

  async findAll(query: Record<string, any>): Promise<IGenericResponse<Blog[]>> {
    const populateFields = query.populate
      ? query.populate.split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.blog);

    const result = await queryBuilder
      .filter(blogFilterFields)
      .search(blogSearchFields)
      .sort()
      .paginate()
      .fields()
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    const isBlogExists = await this.prisma.blog.findUnique({ where: { id } });

    if (!isBlogExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog Not Found');
    }

    return isBlogExists;
  }

  async update(id: string, data: UpdateBlogDto) {
    const existingBlog = await this.prisma.blog.findUnique({ where: { id } });

    if (!existingBlog) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog not found');
    }

    let slug = existingBlog.slug;

    if (data.name && data.name !== existingBlog.name) {
      // For updates, we throw if conflict (strict check), matching CourseService logic
      const newSlug = slugify(data.name, { lower: true, strict: true });

      const isExists = await this.prisma.blog.findFirst({
        where: { slug: newSlug, NOT: { id } },
      });

      if (isExists) {
        throw new ApiError(HttpStatus.CONFLICT, 'Slug already exists for this blog name');
      }
      slug = newSlug;
    }
    // If slug is explicitly updated
    if (data.slug && data.slug !== existingBlog.slug) {
      const isExists = await this.prisma.blog.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });

      if (isExists) {
        throw new ApiError(HttpStatus.CONFLICT, 'Slug already exists');
      }
      slug = data.slug;
    }

    if (data?.url && existingBlog?.url)
      await this.fileService.deleteFromDigitalOcean(existingBlog?.url);
    if (data?.secUrl && existingBlog?.secUrl)
      await this.fileService.deleteFromDigitalOcean(existingBlog?.secUrl);

    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

    return await this.prisma.blog.update({
      where: { id },
      data: {
        ...cleanData,
        slug,
        ...(data?.url ? { url: data.url } : {}),
        ...(data?.secUrl ? { secUrl: data.secUrl } : {}),
      },
    });
  }

  async remove(id: string) {
    const isBlogExists = await this.prisma.blog.findUnique({ where: { id } });

    if (isBlogExists?.url)
      await this.fileService.deleteFromDigitalOcean(isBlogExists?.url as string);

    if (isBlogExists?.secUrl)
      await this.fileService.deleteFromDigitalOcean(isBlogExists?.secUrl as string);

    if (!isBlogExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog Not Found');
    }

    return await this.prisma.blog.delete({
      where: { id },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const slug = slugify(name, { lower: true, strict: true });
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const isExist = await this.prisma.blog.findFirst({
        where: {
          slug: uniqueSlug,
        },
      });

      if (!isExist) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }
}
