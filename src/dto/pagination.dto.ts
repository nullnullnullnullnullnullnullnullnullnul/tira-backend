export interface PaginationQuery {
  page?: string;
  pageSize?: string;
}

export function parsePaginationQuery(query: PaginationQuery) {
  return {
    page: Number(query.page) || 1,
    pageSize: Number(query.pageSize) || 20
  };
}
