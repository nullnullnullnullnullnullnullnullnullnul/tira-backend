import { PaginatedQuery, PathParams } from "./base.dto";

export type CreateCommentParams = PathParams<"task_id">;
export type GetCommentByIdParams = PathParams<"comment_id">;
export type UpdateCommentParams = PathParams<"comment_id">;
export type DeleteCommentParams = PathParams<"comment_id">;

export interface CreateCommentBody {
  author_id: string;
  content: string;
}

export type UpdateCommentBody = Pick<CreateCommentBody, "content">;

export type GetCommentsQuery = PaginatedQuery<{
  comment_id?: string;
  task_id?: string;
  author_id?: string;
}>;
