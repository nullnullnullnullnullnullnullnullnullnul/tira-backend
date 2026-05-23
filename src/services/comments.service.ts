import { ulid } from 'ulid';
import * as commentRepository from '../repositories/comment.repository';
import * as taskRepository from '../repositories/task.repository';
import * as userRepository from '../repositories/user.repository';
import { Comment, CommentFilter } from '../models/comment';
import { PaginatedResult } from '../models/pagination';
import { InternalServerError, NotFoundError, ValidationError } from '../utils/AppError';
import { withAuditedTransaction } from '../utils/transaction';

// Comment content validation:
// - Between 1 and 300 (inclusive) characters long
function isValidCommentContent(content: string): boolean {
  return content.length >= 1 && content.length <= 300;
}

// Create a comment on a task.
//
// Wrapped in withAuditedTransaction because INSERT comments fires
// the log_comment_activity_fn trigger, which reads the
// app.current_user_id session variable for changed_by attribution.
// Without the transaction the SET goes to one pooled connection
// and the INSERT to another, so the trigger sees NULL even when a
// userId was provided.
//
// todo: validate permission to comment (must be team member)
export async function createComment(
  actingUserId: string | undefined,
  task_id: string,
  author_id: string,
  content: string
): Promise<Comment> {
  if (!content || !isValidCommentContent(content)) {
    throw new ValidationError('Comment content must be between 1 and 300 characters');
  }

  return withAuditedTransaction(actingUserId, async (db) => {
    // Check if task exists
    const task = (await taskRepository.selectTask({ task_id }, 1, 1, db)).data[0];
    if (!task) throw new NotFoundError('Task');
    // Check if author exists
    const author = (await userRepository.selectUsers({ user_id: author_id }, 1, 1, db)).data[0];
    if (!author) throw new NotFoundError('User');
    const comment: Comment = {
      comment_id: ulid(),
      task_id,
      author_id,
      content,
      created_at: new Date().toISOString(),
    };
    const newComment = await commentRepository.insertComment(comment, db);
    if (!newComment) throw new InternalServerError('Failed to create comment');
    return newComment;
  });
}

// Get comments with optional filters
export async function getComments(
  filter: CommentFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Comment>> {
  if (filter.task_id) {
    const task = (await taskRepository.selectTask({ task_id: filter.task_id }, 1, 1)).data[0];
    if (!task) throw new NotFoundError('Task');
  }
  if (filter.author_id) {
    const author = (await userRepository.selectUsers({ user_id: filter.author_id }, 1, 1)).data[0];
    if (!author) throw new NotFoundError('User');
  }
  const result = await commentRepository.selectComments(filter, page, pageSize);
  if (filter.comment_id && result.data.length === 0) {
    throw new NotFoundError('Comment');
  }
  return result;
}

// Update comment content.
//
// Not wrapped in a transaction: UPDATE comments does NOT fire any
// audit trigger (the triggers in migration 0012 only fire on
// INSERT for comments), so there is nothing to attribute.
export async function updateComment(
  comment_id: string,
  content: string
): Promise<Comment> {
  if (!content || !isValidCommentContent(content)) {
    throw new ValidationError('Comment content must be between 1 and 300 characters');
  }
  // Check if comment exists
  await getComments({ comment_id }, 0, 1);
  const updated = await commentRepository.updateComment(comment_id, content);
  if (!updated) throw new NotFoundError('Comment');
  return updated;
}

// Delete comment.
//
// Not wrapped in a transaction: DELETE comments does NOT fire any
// audit trigger.
export async function deleteComment(comment_id: string): Promise<void> {
  await getComments({ comment_id }, 0, 1);
  await commentRepository.deleteComment(comment_id);
}
