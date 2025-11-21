import { PaginationQuery } from "./pagination.dto";

export type PathParams<K extends string> = {
  [P in K]: string;
};

export type PaginatedQuery<Filters extends object = Record<never, never>> = PaginationQuery & Filters;
