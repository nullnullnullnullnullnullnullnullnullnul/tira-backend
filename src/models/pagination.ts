import { BaseModel } from './base';

/**
 * Generic pagination result wrapper
 * Used by all repository functions that return paginated data
 * @template T - Must extend BaseModel for type safety
 */
export interface PaginatedResult<T extends BaseModel> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Helper function to create a paginated result
 * Extracts total_count from query results and formats the response
 * @template T - The model type being paginated
 */
export function createPaginatedResult<T extends BaseModel>(
  rows: (T & { total_count?: string | number })[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = rows.length > 0
    ? (typeof rows[0]?.total_count === 'string'
      ? parseInt(rows[0].total_count, 10)
      : rows[0]?.total_count ?? 0)
    : 0;
  const data = rows.map(({ total_count, ...item }) => item as T);
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
