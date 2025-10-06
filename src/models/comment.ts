export type Comment = {
  comment_id: string;
  task_id: string;
  author_id: string | null;
  content: string | null;
  created_at: string;
}

export type CommentFilter = {
  comment_id?: string;
  task_id?: string;
  author_id?: string;
}
