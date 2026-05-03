import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  categoryFilterFields,
  categoryInclude,
  categoryNestedFilters,
  categorySearchFields,
} from '@/modules/category/category.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { FileService } from '@/helper/file.service';
import { generateSlug } from '@/utils/slug-generator';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(paylaod: CreateCategoryDto, files: { thumbnail?: Express.Multer.File[] }) {
    if (files?.thumbnail && files.thumbnail.length > 0) {
      const thumbnail = await this.fileService.uploadToCloudinary(files.thumbnail[0]);
      paylaod.thumbnail = thumbnail;
    }
    if (!paylaod.slug) {
      paylaod.slug = await this.generateUniqueSlug(paylaod.name);
    } else {
      paylaod.slug = await this.generateUniqueSlug(paylaod.slug);
    }

    // Handle ordering logic
    const maxOrderRes = await this.prisma.category.aggregate({
      _max: { order: true },
    });
    const maxOrder = maxOrderRes._max.order ?? 0;

    if (paylaod.order === undefined || paylaod.order === null) {
      paylaod.order = maxOrder + 1;
    } else {
      // Shift existing categories to make room
      await this.reorderCategories({ targetOrder: paylaod.order });
    }

    return await this.prisma.category.create({
      data: paylaod,
    });
  }

  async findAll(req: Request) {
    const query = req.query;
    const user = (req as any).user;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.category);
    const result = await queryBuilder

      .filter(categoryFilterFields)
      .search(categorySearchFields)
      .nestedFilter(categoryNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(categoryInclude)
      .rawFilter({})
      .populate(populateFields)
      // .getAllQueries()
      .execute();

    const meta = await queryBuilder.countTotal();

    // Enrich categories with progress and enrollment data
    const enrichedData = await this.enrichCategoriesWithProgress(result as any[], user);

    return { meta, data: enrichedData };
  }

  async findOne(id: string, req?: Request) {
    const user = req ? (req as any).user : null;

    const isCategoryExists = await this.prisma.category.findUnique({
      where: { id },
      include: categoryInclude,
    });

    if (!isCategoryExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'category not found');
    }

    // Enrich single category with progress data
    const [enriched] = await this.enrichCategoriesWithProgress([isCategoryExists as any], user);

    return enriched;
  }

  async update(
    id: string,
    paylaod: UpdateCategoryDto,
    files?: { thumbnail?: Express.Multer.File[] },
  ) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'category not found with this id:' + id);
    }

    if (files?.thumbnail?.[0]) {
      paylaod.thumbnail = await this.fileService.uploadToCloudinary(files.thumbnail[0]);
    }

    if (paylaod.name && isExist.name !== paylaod.name) {
      const slug = generateSlug(paylaod.name);
      const isSlugExist = await this.slugValidator(slug);
      if (isSlugExist) {
        throw new ApiError(HttpStatus.CONFLICT, 'Slug already exists for this category name');
      }
      paylaod.slug = slug;
    }

    // Delete old thumbnail from Cloudinary only when a new one is uploaded
    if (files?.thumbnail?.[0] && isExist?.thumbnail) {
      await this.fileService.deleteFromCloudinary(isExist.thumbnail);
    }

    // Handle ordering logic if being updated
    if (paylaod.order !== undefined && paylaod.order !== isExist.order) {
      await this.reorderCategories({
        targetOrder: paylaod.order,
        currentOrder: isExist.order,
      });
    }

    return await this.prisma.category.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(id: string) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'category not found with this id:' + id);
    }

    const deletedOrder = isExist.order;
    const deleted = await this.prisma.category.delete({
      where: { id },
    });

    // Close the gap in ordering
    await this.reorderCategories({ targetOrder: deletedOrder, isDelete: true });

    return deleted;
  }

  /**
   * Enriches category data with user-specific progress and enrollment info.
   * - `isEnrolled`: whether the user has a CourseProgress record for this category
   * - `progress`: percentage of courses completed (0–100)
   * - Each course (module) gets an `isCompleted` field
   *
   * If customerId is provided, it uses that directly.
   * Otherwise, it tries to find the customer from the user object.
   * If neither is available, it returns default falsy values.
   */
  public async enrichCategoriesWithProgress(
    categories: any[],
    user?: { id: string; role: string },
    customerId?: string,
  ) {
    let targetCustomerId = customerId;

    // If customerId was not provided, try to find it from the user object
    if (!targetCustomerId && user?.id) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
      });
      if (customer) {
        targetCustomerId = customer.id;
      }
    }

    // If no customer ID is available, return defaults
    if (!targetCustomerId) {
      return categories.map((category) => ({
        ...category,
        isEnrolled: false,
        progress: 0,
        modules: category.modules?.map((course: any) => ({
          ...course,
          isCompleted: false,
        })),
      }));
    }

    const categoryIds = categories.map((c) => c.id);

    // Fetch all course progress records for this customer in these categories
    const courseProgresses = await this.prisma.courseProgress.findMany({
      where: {
        customerId: targetCustomerId,
        categoryId: { in: categoryIds },
      },
      include: {
        course: { select: { order: true } },
      },
    });

    // Build a map: categoryId -> courseProgress
    const progressMap = new Map<string, (typeof courseProgresses)[0]>();
    for (const cp of courseProgresses) {
      progressMap.set(cp.categoryId, cp);
    }

    // Enrich each category
    return categories.map((category) => {
      const courseProgress = progressMap.get(category.id);
      const isEnrolled = !!courseProgress;

      const totalCourses = category.modules?.length || 0;

      let progress = 0;
      if (isEnrolled && totalCourses > 0) {
        if (courseProgress.isCompleted) {
          progress = 100;
        } else {
          // lastPosition = number of videos the user has completed (0-indexed progress)
          const completedVideos = courseProgress.lastPosition;
          progress = Math.round((completedVideos / totalCourses) * 100);
        }
      }

      // Enrich each course/module with isCompleted
      const enrichedModules = category.modules?.map((course: any) => {
        let isCompleted = false;

        if (isEnrolled) {
          if (courseProgress.isCompleted) {
            // Entire category is completed — all courses are completed
            isCompleted = true;
          } else {
            // A course is completed if its order is less than the current course's order
            isCompleted = course.order < courseProgress.course.order;
          }
        }

        return {
          ...course,
          isCompleted,
        };
      });

      return {
        ...category,
        isEnrolled,
        progress,
        modules: enrichedModules,
      };
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const slug = generateSlug(name);
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const isExist = await this.prisma.category.findFirst({
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

  private async slugValidator(slug: string): Promise<boolean> {
    const isExist = await this.prisma.category.findFirst({
      where: {
        slug,
      },
    });

    return !!isExist;
  }

  /**
   * Reorders categories based on movement or deletion.
   * Handles shifting logic sequentially for MongoDB/Prisma compatibility.
   */
  private async reorderCategories(params: {
    targetOrder: number;
    currentOrder?: number;
    isDelete?: boolean;
  }) {
    const { targetOrder, currentOrder, isDelete } = params;

    if (isDelete) {
      // Shifting down: categories with order > deletedOrder
      const subsequent = await this.prisma.category.findMany({
        where: { order: { gt: targetOrder } },
        orderBy: { order: 'asc' },
      });
      const updates = subsequent.map((cat) =>
        this.prisma.category.update({
          where: { id: cat.id },
          data: { order: cat.order - 1 },
        }),
      );
      await this.prisma.$transaction(updates);
      return;
    }

    if (currentOrder === undefined) {
      // Creating a new category at a specific targetOrder: shift UP everything >= targetOrder
      const affected = await this.prisma.category.findMany({
        where: { order: { gte: targetOrder } },
        orderBy: { order: 'desc' }, // Descending to avoid temporary ID/Constraint collisions
      });
      const updates = affected.map((cat) =>
        this.prisma.category.update({
          where: { id: cat.id },
          data: { order: cat.order + 1 },
        }),
      );
      await this.prisma.$transaction(updates);
    } else if (targetOrder !== currentOrder) {
      // Moving an existing category to a new targetOrder
      if (targetOrder < currentOrder) {
        // Shifting UP: categories in range [targetOrder, currentOrder - 1]
        const affected = await this.prisma.category.findMany({
          where: { order: { gte: targetOrder, lt: currentOrder } },
          orderBy: { order: 'desc' },
        });
        const updates = affected.map((cat) =>
          this.prisma.category.update({
            where: { id: cat.id },
            data: { order: cat.order + 1 },
          }),
        );
        await this.prisma.$transaction(updates);
      } else {
        // Shifting DOWN: categories in range [currentOrder + 1, targetOrder]
        const affected = await this.prisma.category.findMany({
          where: { order: { gt: currentOrder, lte: targetOrder } },
          orderBy: { order: 'asc' },
        });
        const updates = affected.map((cat) =>
          this.prisma.category.update({
            where: { id: cat.id },
            data: { order: cat.order - 1 },
          }),
        );
        await this.prisma.$transaction(updates);
      }
    }
  }
}
