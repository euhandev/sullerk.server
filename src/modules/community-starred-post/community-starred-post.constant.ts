import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityStarredPostFilterFields: (keyof Prisma.CommunityStarredPostFieldRefs)[] = [];

// Fields for top-level search
export const communityStarredPostSearchFields: (keyof Prisma.CommunityStarredPostFieldRefs)[] = [];

// Nested filtering config
export const communityStarredPostNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const communityStarredPostRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const communityStarredPostInclude: Prisma.CommunityStarredPostInclude = {};
