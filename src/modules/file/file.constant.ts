import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
// Fields for basic filtering
export const fileFilterFields = [];

// Fields for top-level search
export const fileSearchFields = [];

// Nested filtering config
export const fileNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const fileRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
// export const fileInclude: Prisma.FileInclude = {};
