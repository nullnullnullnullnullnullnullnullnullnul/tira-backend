import { PathParams } from "./base.dto";
import { PaginationQuery } from "./pagination.dto";

export type CreateTagParams = PathParams<"team_id">;
export type GetTagsByTeamParams = PathParams<"team_id">;
export type GetTagByIdParams = PathParams<"tag_id" | "team_id">;
export type UpdateTagParams = PathParams<"tag_id" | "team_id">;
export type DeleteTagParams = PathParams<"tag_id" | "team_id">;
export type AddTagToTaskParams = PathParams<"task_id">;
export type RemoveTagFromTaskParams = PathParams<"task_id" | "tag_id">;
export type GetTagsByTaskParams = PathParams<"task_id">;
export type GetTasksByTagParams = PathParams<"tag_id" | "team_id">;

// Request Body interfaces
export interface CreateTagBody {
  name: string;
}

export interface UpdateTagBody {
  name: string;
}

export interface AddTagToTaskBody {
  tag_id: string;
}

export type GetTagsByTeamQuery = PaginationQuery;
export type GetTasksByTagQuery = PaginationQuery;
