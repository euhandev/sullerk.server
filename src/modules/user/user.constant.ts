import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const userFilterFields: (keyof Prisma.UserFieldRefs)[] = [
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
export const userSearchFields: (keyof Prisma.UserFieldRefs)[] = [
  `contactNo`,
  `contactNo`,
  `email`,
  `username`,
];

// Nested filtering config
export const userNestedFilters: NestedFilter[] = [
  // {
  //   key: 'user',
  //   searchOption: 'exact',
  //   queryFields: [
  //     'fullName',
  //     'country',
  //     'bloodGroup',
  //     'gender',
  //     'address',
  //     'city',
  //     'zip',
  //     'state',
  //     'country',
  //   ],
  // },
];

// Range-based filtering config
export const userRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const userInclude: Prisma.UserInclude = {
  customer: true,
  admin: true
};
