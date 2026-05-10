import { NestedFilter } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';

export const collectionFilterFields = ['name'];
export const collectionSearchFields = ['name', 'description'];

export const collectionNestedFilters: NestedFilter[] = [
  {
    key: 'listings',
    searchOption: 'exact',
    queryFields: ['listingId'],
  },
];

export const collectionInclude: Prisma.CollectionInclude = {
  listings: {
    include: {
      listing: true,
    },
  },
};
