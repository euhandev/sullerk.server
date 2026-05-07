import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityReactionFilterFields: (keyof Prisma.CommunityReactionFieldRefs)[] = [];

// Fields for top-level search
export const communityReactionSearchFields: (keyof Prisma.CommunityReactionFieldRefs)[] = [];

// Nested filtering config
export const communityReactionNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const communityReactionRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const communityReactionInclude: Prisma.CommunityReactionInclude = {};
