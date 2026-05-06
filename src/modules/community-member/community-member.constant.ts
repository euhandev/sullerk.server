
import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityMemberFilterFields: (keyof Prisma.CommunityMemberFieldRefs)[] = [
  'communityId',
  'customerId',
  'status',
  'userType',
];

// Fields for top-level search
export const communityMemberSearchFields:(keyof Prisma.CommunityMemberFieldRefs)[] = [];

// Nested filtering config
export const communityMemberNestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Range-based filtering config
export const communityMemberRangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma include configuration
export const communityMemberInclude: Prisma.CommunityMemberInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      user: {
        select: {
          avatar: true,
        },
      },
    },
  },
};
