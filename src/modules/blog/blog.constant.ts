import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const blogFilterFields: (keyof Prisma.BlogFieldRefs)[] = [
  `name`,
  `slug`,
  `writer`,
  `description`,
];

// Fields for top-level search
export const blogSearchFields: (keyof Prisma.BlogFieldRefs)[] = [`name`, `slug`, `writer`];

// Nested filtering config
export const blogNestedFilters: NestedFilter[] = [];

// Range-based filtering config
export const blogRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
// export const bookingInclude: Prisma.BlogInclude = {
//   // Booking: true,
// };
