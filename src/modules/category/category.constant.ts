import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const categoryFilterFields: (keyof Prisma.CategoryFieldRefs)[] = [
  `name`,
  `slug`,
  `referralPath`,
  `targetAudience`,
];

// Fields for top-level search
export const categorySearchFields: (keyof Prisma.CategoryFieldRefs)[] = [
  `name`,
  `slug`,
  `description`,
];

// Nested filtering config
export const categoryNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const categoryRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const categoryInclude: Prisma.CategoryInclude = {
  modules: true,
};
