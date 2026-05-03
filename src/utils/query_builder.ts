export type TSearchOption = 'exact' | 'partial' | 'enum' | 'search' | undefined;

export type NestedFilter = {
  key: string;
  searchOption?: TSearchOption;
  queryFields: string[];
  fieldMap?: Record<string, string>;
};

export interface rangeFilteringPrams {
  field: string;
  nestedField?: string;
  maxQueryKey: string;
  minQueryKey: string;
  dataType: 'string' | 'number' | 'date';
}

/**
 * A generic query builder for Prisma that handles searching, filtering,
 * sorting, and pagination consistently across models.
 *
 * It uses the `AND` and `OR` arrays in Prisma's where clause to safely
 * merge multiple conditions without overwriting.
 */
class QueryBuilder<T> {
  private model: any;
  private query: Record<string, unknown>;
  private prismaQuery: Record<string, any> = { where: {} };
  private searchConditions: any[] = [];

  constructor(query: Record<string, unknown>, model: any, staticFilter: Partial<T> = {}) {
    this.model = model;
    this.query = query;
    this.prismaQuery.where = { ...staticFilter };
  }

  private buildNestedCondition(path: string[], value: any, index = 0): Record<string, any> {
    const key = path[index];
    if (index === path.length - 1) {
      return { [key]: value };
    }
    return { [key]: this.buildNestedCondition(path, value, index + 1) };
  }

  private pick(keys: string[]) {
    const finalObj: Record<string, any> = {};
    for (const key of keys) {
      if (this.query && Object.prototype.hasOwnProperty.call(this.query, key)) {
        finalObj[key] = this.query[key];
      }
    }
    return finalObj;
  }

  // Search functionality
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm && searchableFields.length > 0) {
      const searchConditions = searchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      }));

      this.searchConditions.push(...searchConditions);
    }
    return this;
  }

  // Basic filtering
  filter(includeFields: string[] = []) {
    const queryObj = this.pick(includeFields);
    const filters: Record<string, any>[] = [];

    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'string' && value.includes('[')) {
        const [field, operator] = key.split('[');
        const op = operator.slice(0, -1);
        filters.push({ [field]: { [op]: parseFloat(value) } });
      } else {
        const hasComma = typeof value === 'string' && value.includes(',');
        if (Array.isArray(value) || hasComma) {
          filters.push({ [key]: { in: hasComma ? (value as string).split(',') : value } });
        } else {
          filters.push({ [key]: value });
        }
      }
    }

    if (filters.length > 0) {
      filters.forEach((f) => this.addAndCondition(f));
    }

    return this;
  }

  // Nested filtering
  nestedFilter(nestedFilters: NestedFilter[]) {
    nestedFilters.forEach(({ key, searchOption, queryFields, fieldMap = {} }) => {
      const pathSegments = key.split('.');
      const queryObj = this.pick(queryFields);

      if (Object.keys(queryObj).length === 0 && searchOption !== 'search') return;

      if (searchOption === 'search') {
        const searchTerm = this.query.searchTerm as string;
        if (searchTerm) {
          const searchConditions = queryFields.map((field) => {
            const condition = { [field]: { contains: searchTerm, mode: 'insensitive' } };
            return this.buildNestedCondition(pathSegments, condition);
          });
          this.searchConditions.push(...searchConditions);
        }
      } else if (searchOption === 'partial') {
        const partialConditions = Object.entries(queryObj).map(([queryField, value]) => {
          const modelField = fieldMap[queryField] ?? queryField;
          const condition = { [modelField]: { equals: value, mode: 'insensitive' } };
          return this.buildNestedCondition(pathSegments, condition);
        });
        if (partialConditions.length > 0) {
          this.addAndCondition({ OR: partialConditions });
        }
      } else {
        const nestedModelConditions: Record<string, any> = {};
        for (const [queryField, value] of Object.entries(queryObj)) {
          const modelField = fieldMap[queryField] ?? queryField;
          const hasComma = typeof value === 'string' && value.includes(',');

          if (searchOption === 'enum' || searchOption === 'exact') {
            if (Array.isArray(value) || hasComma) {
              nestedModelConditions[modelField] = {
                in: hasComma ? (value as string).split(',') : value,
              };
            } else {
              nestedModelConditions[modelField] = { equals: value };
            }
          } else {
            nestedModelConditions[modelField] = { contains: value, mode: 'insensitive' };
          }
        }

        if (Object.keys(nestedModelConditions).length > 0) {
          this.addAndCondition(
            this.buildNestedCondition(pathSegments, { some: nestedModelConditions }),
          );
        }
      }
    });

    return this;
  }

  // Range-based filtering
  filterByRange(betweenFilters: rangeFilteringPrams[]) {
    betweenFilters.forEach(({ field, maxQueryKey, minQueryKey, nestedField, dataType }) => {
      const queryObj = this.pick([maxQueryKey, minQueryKey]);
      let maxValue = queryObj[maxQueryKey];
      let minValue = queryObj[minQueryKey];

      if (maxValue === undefined && minValue === undefined) return;

      const castValue = (value: any) => {
        if (dataType === 'date') {
          const dateParts = value.split('-');
          return new Date(
            Date.UTC(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])),
          );
        }
        if (dataType === 'number') return Number(value);
        return value;
      };

      if (maxValue !== undefined) maxValue = castValue(maxValue);
      if (minValue !== undefined) minValue = castValue(minValue);

      const condition: Record<string, any> = {
        [field]: {
          ...(minValue !== undefined ? { gte: minValue } : {}),
          ...(maxValue !== undefined ? { lte: maxValue } : {}),
        },
      };

      if (nestedField) {
        this.addAndCondition(this.buildNestedCondition(nestedField.split('.'), condition));
      } else {
        this.addAndCondition(condition);
      }
    });

    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(',') || ['-createdAt'];
    const orderBy = sort.map((field) => {
      if (field.startsWith('-')) {
        return { [field.slice(1)]: 'desc' };
      }
      return { [field]: 'asc' };
    });

    this.prismaQuery.orderBy = orderBy;
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }

  // Fields selection
  fields() {
    const fields = (this.query.fields as string)?.split(',') || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce((acc: Record<string, boolean>, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }
    return this;
  }

  // Include relations
  include(includableFields: Record<string, boolean | object>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...includableFields,
    };
    return this;
  }

  // Populate relations (legacy support/alternate name)
  populate(relations: Record<string, boolean | object>) {
    return this.include(relations);
  }

  // Omit fields
  omit(omitableFields: Record<string, boolean | object>) {
    this.prismaQuery.omit = {
      ...this.prismaQuery.omit,
      ...omitableFields,
    };
    return this;
  }

  // Raw filter merge
  rawFilter(filters: Record<string, any>) {
    this.addAndCondition(filters);
    return this;
  }

  // Check for existence
  hasOrNot() {
    const queryObj = this.pick(['has', 'not']);
    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'string') {
        if (key === 'has') {
          this.addAndCondition({ [value]: { not: null } });
        } else {
          this.addAndCondition({ [value]: null });
        }
      }
    }
    return this;
  }

  // Aggregation
  aggregate(aggregations: Record<string, any>) {
    this.prismaQuery.aggregate = {
      ...this.prismaQuery.aggregate,
      ...aggregations,
    };
    return this;
  }

  // Execute findMany
  async execute() {
    this.applySearch();
    console.log(JSON.stringify(this.prismaQuery, null, 2));
    return this.model.findMany(this.prismaQuery);
  }

  // Execute aggregation
  async executeAggregate() {
    this.applySearch();
    return this.model.aggregate({
      where: this.prismaQuery.where,
      ...this.prismaQuery.aggregate,
    });
  }

  // Count total for pagination meta
  async countTotal() {
    this.applySearch();
    const total = await this.model.count({ where: this.prismaQuery.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return { page, limit, total, totalPage };
  }

  private applySearch() {
    if (this.searchConditions.length > 0) {
      this.addAndCondition({ OR: this.searchConditions });
      this.searchConditions = [];
    }
  }

  // Internal helper to safely add AND conditions
  private addAndCondition(condition: Record<string, any>) {
    if (!this.prismaQuery.where.AND) {
      this.prismaQuery.where.AND = [];
    }
    if (Array.isArray(this.prismaQuery.where.AND)) {
      this.prismaQuery.where.AND.push(condition);
    } else {
      // If AND was somehow a single object, convert to array
      this.prismaQuery.where.AND = [this.prismaQuery.where.AND, condition];
    }
  }

  getAllQueries() {
    return this.prismaQuery;
  }
}

export default QueryBuilder;
