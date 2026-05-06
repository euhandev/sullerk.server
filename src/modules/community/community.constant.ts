import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityFilterFields: (keyof Prisma.CommunityFieldRefs)[] = [];

// Fields for top-level search
export const communitySearchFields: (keyof Prisma.CommunityFieldRefs)[] = [];

// Nested filtering config
export const communityNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const communityRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
// Prisma include configuration
export const communityInclude: Prisma.CommunityInclude = {
  _count: {
    select: {
      members: true,
      posts: true,
    },
  },
};
