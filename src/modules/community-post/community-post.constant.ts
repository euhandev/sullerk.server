import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityPostFilterFields: (keyof Prisma.CommunityPostFieldRefs)[] = [];

// Fields for top-level search
export const communityPostSearchFields: (keyof Prisma.CommunityPostFieldRefs)[] = [];

// Nested filtering config
export const communityPostNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const communityPostRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const communityPostInclude: Prisma.CommunityPostInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      user: {
        select: {
          avatar: true,
        },
      },
    },
  },
  files: true,
  _count: {
    select: {
      reactions: true,
      reports: true,
      comments: true,
    },
  },
};
