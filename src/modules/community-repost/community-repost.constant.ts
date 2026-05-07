import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityRepostFilterFields: (keyof Prisma.CommunityRepostFieldRefs)[] = [];

// Fields for top-level search
export const communityRepostSearchFields: (keyof Prisma.CommunityRepostFieldRefs)[] = [];

// Nested filtering config
export const communityRepostNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const communityRepostRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const communityRepostInclude: Prisma.CommunityRepostInclude = {};
