import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';

// Fields for basic filtering
export const chatFilterFields = [];

// Fields for top-level search
export const chatSearchFields = [];

// Nested filtering config
export const chatNestedFilters: NestedFilter[] = [];

// Range-based filtering config
export const chatRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const chatInclude: Prisma.ChatInclude = {
  sender: { select: { avatar: true, username: true } },
  attachments: true,
};
