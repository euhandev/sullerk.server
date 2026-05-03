import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const newsletterFilterFields: (keyof Prisma.NewsletterFieldRefs)[] = [
  `AdvisorId`,
  `customerId`,
  `email`,
];

// Fields for top-level search
export const newsletterSearchFields: (keyof Prisma.NewsletterFieldRefs)[] = [
  `AdvisorId`,
  `customerId`,
  `email`,
];

// Nested filtering config
export const newsletterNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Range-based filtering config
export const newsletterRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const newsletterInclude: Prisma.NewsletterInclude = {};
