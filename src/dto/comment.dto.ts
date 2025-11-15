import { PaginationQuery } from "./pagination.dto";

export interface CreateCommentParams extends Record<string, string> {
  task_id: string;
}

export interface GetCommentByIdParams extends Record<string, string> {
  comment_id: string;
}

export interface UpdateCommentParams extends Record<string, string> {
  comment_id: string;
}

export interface DeleteCommentParams extends Record<string, string> {
  comment_id: string;
}

export interface CreateCommentBody {
  author_id: string;
  content: string;
}

export interface UpdateCommentBody {
  content: string;
}

export interface GetCommentsQuery extends PaginationQuery {
  comment_id?: string;
  task_id?: string;
  author_id?: string;
}
