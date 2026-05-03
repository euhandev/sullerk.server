export const constantTemplate = ({ camel, pascal }) => `
import { NestedFilter, rangeFilteringPrams } from '@/utils/query_builder';
import { Prisma } from '@prisma/client';
// Fields for basic filtering
export const ${camel}FilterFields:(keyof Prisma.${pascal}FieldRefs)[] = [];

// Fields for top-level search
export const ${camel}SearchFields:(keyof Prisma.${pascal}FieldRefs)[] = [];

// Nested filtering config
export const ${camel}NestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Range-based filtering config
export const ${camel}RangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma include configuration
export const ${camel}Include:Prisma.${pascal}Include = {
	
};
`;
