import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const adminFilterFields: (keyof Prisma.UserFieldRefs)[] = [
  `contactNo`,
  `contactNo`,
  `email`,
  `lang`,
  `role`,
  `status`,
  `username`,
  `dob`,
];

// Fields for top-level search
export const adminSearchFields: (keyof Prisma.UserFieldRefs)[] = [`contactNo`, `email`, `username`];

// Nested filtering config
export const adminNestedFilters: NestedFilter[] = [
  {
    key: 'admin',
    searchOption: 'exact',
    queryFields: ['fullName', 'city'],
  },
  {
    key: 'admin',
    searchOption: 'search',
    queryFields: ['fullName'],
  },
];

// Range-based filtering config
export const adminRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const adminInclude: Prisma.UserInclude = {
  admin: true,
};
