
import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const communityCommentFilterFields:(keyof Prisma.CommunityCommentFieldRefs)[] = [];

// Fields for top-level search
export const communityCommentSearchFields:(keyof Prisma.CommunityCommentFieldRefs)[] = [];

// Nested filtering config
export const communityCommentNestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Range-based filtering config
export const communityCommentRangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma include configuration
export const communityCommentInclude: Prisma.CommunityCommentInclude = {
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
