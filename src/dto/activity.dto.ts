import { PathParams } from "./base.dto";
import { PaginationQuery } from "./pagination.dto";

export type GetUserActivityParams = PathParams<"user_id">;
export type GetUserActivityQuery = PaginationQuery;
