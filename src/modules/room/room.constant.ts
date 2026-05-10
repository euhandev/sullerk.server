import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';

// Fields for basic filtering
export const roomFilterFields = ['name', 'type'];

// Fields for top-level search
export const roomSearchFields = [];

// Nested filtering config
export const roomNestedFilters: NestedFilter[] = [];

// Range-based filtering config
export const roomRangeFilter: rangeFilteringPrams[] = [
  {
    field: 'createdAt',
    maxQueryKey: 'maxDate',
    minQueryKey: 'minDate',
    dataType: 'date',
  },
];

// Prisma include configuration
export const roomInclude: Prisma.RoomInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          avatar: true,
          email: true,
          username: true,
          role: true,
        },
      },
    },
  },
  // _count: { select: { chat: { where: { isRead: false } } } },
};

export type RoomWithInclude = Prisma.RoomGetPayload<{
  include: typeof roomInclude;
}>;
