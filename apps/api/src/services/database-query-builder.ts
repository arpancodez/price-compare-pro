export class QueryBuilder {
  private filters: Record<string, any> = {};
  private sorting: Record<string, 'asc' | 'desc'> = {};
  private limit_val = 10;
  private offset_val = 0;

  where(field: string, value: any): this {
    this.filters[field] = value;
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorting[field] = direction;
    return this;
  }

  limit(count: number): this {
    this.limit_val = count;
    return this;
  }

  offset(count: number): this {
    this.offset_val = count;
    return this;
  }

  build(): any {
    return {
      filters: this.filters,
      sort: this.sorting,
      limit: this.limit_val,
      skip: this.offset_val,
    };
  }
}
