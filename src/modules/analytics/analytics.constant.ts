import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
// Fields for basic filtering
// export const analyticsFilterFields: (keyof Prisma.analyticsFieldRefs)[] = [];

// // Fields for top-level search
// export const analyticsSearchFields: (keyof Prisma.analyticsFieldRefs)[] = [];

// Nested filtering config
export const analyticsNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const analyticsRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
// export const analyticsInclude: Prisma.AnalyticsInclude = {};
