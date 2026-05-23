import pool, { Executor } from '../db';
import { Comment, CommentFilter } from '../models/comment';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

// Insert new comment
export async function insertComment(comment: Comment, db: Executor = pool): Promise<Comment | null> {
  const result = await db.query(`
    INSERT INTO comments(comment_id, task_id, author_id, content, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [comment.comment_id, comment.task_id, comment.author_id, comment.content, comment.created_at]);
  return result.rows[0] ?? null;
}

// Delete comment
export async function deleteComment(comment_id: string, db: Executor = pool): Promise<boolean> {
  const result = await db.query(`
    DELETE FROM comments
    WHERE comment_id = $1
  `,
    [comment_id]);
  return (result.rowCount ?? 0) > 0;
}

// Select comments with optional filters:
// - comment_id
// - task_id
// - author_id
export async function selectComments(
  filter: CommentFilter = {},
  page: number = 1,
  pageSize: number = 100,
  db: Executor = pool,
): Promise<PaginatedResult<Comment>> {
  const conditions: string[] = [];
  const values: any[] = [];
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    values.push(value);
    conditions.push(`${key} = $${values.length}`);
  });
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await db.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM comments
    ${where}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `,
    values);
  return createPaginatedResult<Comment>(result.rows, page, pageSize);
}

// Update comment content
export async function updateComment(
  comment_id: string,
  content: string,
  db: Executor = pool,
): Promise<Comment | null> {
  const result = await db.query(`
    UPDATE comments
    SET content = $1
    WHERE comment_id = $2
    RETURNING *
  `,
    [content, comment_id]);
  return result.rows[0] ?? null;
}
