import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
  collectionFilterFields,
  collectionInclude,
  collectionNestedFilters,
  collectionSearchFields,
} from './collection.constant';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async create(createCollectionDto: CreateCollectionDto) {
    const { listingIds, ...collectionData } = createCollectionDto;

    return await this.prisma.collection.create({
      data: {
        ...collectionData,
        listings: {
          create: listingIds?.map((id) => ({ listingId: id })),
        },
      },
      include: collectionInclude,
    });
  }

  async findAll(query: Record<string, any>) {
    const queryBuilder = new QueryBuilder(query, this.prisma.collection);

    const result = await queryBuilder
      .filter(collectionFilterFields)
      .search(collectionSearchFields)
      .nestedFilter(collectionNestedFilters)
      .sort()
      .paginate()
      .include(collectionInclude)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findAllListings(collectionId: string, query: Record<string, any>) {
    const isExists = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!isExists) throw new ApiError(HttpStatus.NOT_FOUND, 'Collection not found');

    const queryBuilder = new QueryBuilder(query, this.prisma.collectionListing);

    const result = await queryBuilder
      .filter(collectionFilterFields)
      .search(collectionSearchFields)
      .nestedFilter(collectionNestedFilters)
      .sort()
      .paginate()
      .include({ listing: true })
      .rawFilter({ collectionId })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: collectionInclude,
    });

    if (!collection) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Collection not found');
    }

    return collection;
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const { listingIds, ...collectionData } = updateCollectionDto;

    const isExists = await this.prisma.collection.findUnique({ where: { id } });
    if (!isExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Collection not found');
    }

    return await this.prisma.collection.update({
      where: { id },
      data: {
        ...collectionData,
        ...(listingIds && {
          listings: {
            deleteMany: {},
            create: listingIds.map((id) => ({ listingId: id })),
          },
        }),
      },
      include: collectionInclude,
    });
  }

  async remove(id: string) {
    const isExists = await this.prisma.collection.findUnique({ where: { id } });
    if (!isExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Collection not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.collectionListing.deleteMany({ where: { collectionId: id } });
      return await tx.collection.delete({ where: { id } });
    });
  }

  async addListing(collectionId: string, listingId: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new ApiError(HttpStatus.NOT_FOUND, 'Collection not found');

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');

    return await this.prisma.collectionListing.upsert({
      where: {
        collectionId_listingId: {
          collectionId,
          listingId,
        },
      },
      update: {},
      create: {
        collectionId,
        listingId,
      },
    });
  }

  async removeListing(collectionId: string, listingId: string) {
    return await this.prisma.collectionListing.deleteMany({
      where: {
        collectionId,
        listingId,
      },
    });
  }
}
