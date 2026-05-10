import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const customerFilterFields: (keyof Prisma.UserFieldRefs)[] = [
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
export const customerSearchFields: (keyof Prisma.UserFieldRefs)[] = [`email`];

// Nested filtering config
export const customerNestedFilters: NestedFilter[] = [
  {
    key: 'customer',
    searchOption: 'exact',
    queryFields: [
      'fullName',
      'country',
      'bloodGroup',
      'gender',
      'address',
      'city',
      'zip',
      'state',
      'country',
    ],
  },
  {
    key: 'customer',
    searchOption: 'search',
    queryFields: ['fullName'],
  },
];

// Range-based filtering config
export const customerRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const customerInclude: Prisma.UserInclude = {
  customer: {
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  },
};
