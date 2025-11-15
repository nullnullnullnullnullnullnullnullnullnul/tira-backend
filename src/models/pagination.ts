/**
 * Base interface that all model entities should extend
 * Ensures only proper model types can be paginated
 */
export interface BaseModel {
  // Only key, value pairs are valid
  // Key must be a string while values can be any
  [key: string]: any;
}

/**
 * Generic pagination result wrapper
 * Used by all repository functions that return paginated data
 * @template T - Must be an object type
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
 */
export function createPaginatedResult<T extends BaseModel>(
  // rows: Array conbines model T and optionally total_count
  // total_count? -> if the query returns no rows theres no total_count
  rows: (T & { total_count?: string })[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = rows.length > 0 ? parseInt(rows[0]?.total_count || '0') : 0;
  const totalPages = Math.ceil(total / pageSize);
  const data = rows.map(({ total_count, ...item }) => item as T);
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages
    }
  };
}
