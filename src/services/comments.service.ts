import { ulid } from 'ulid';
import * as commentRepository from '../repositories/comment.repository';
import * as taskRepository from '../repositories/task.repository';
import * as userRepository from '../repositories/user.repository';
import { Comment, CommentFilter } from '../models/comment';
import { PaginatedResult } from '../models/pagination';
import { InternalServerError, NotFoundError, ValidationError } from '../utils/AppError';
import { notFoundHandler } from '../middleware/NotFound';

// Comment content validation:
// - Between 1 and 300 (inclusive) characters long
function isValidCommentContent(content: string): boolean {
  return content.length >= 1 && content.length <= 300;
}

// Create a comment on a task
// todo: validate permission to comment (must be team member)
export async function createComment(
  task_id: string,
  author_id: string,
  content: string
): Promise<Comment> {
  if (!content || !isValidCommentContent(content)) {
    throw new ValidationError('Comment content must be between 1 and 300 characters');
  }
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 1, 1)).data[0];
  if (!task) throw new NotFoundError('Task');
  // Check if author exists
  const author = (await userRepository.selectUsers({ user_id: author_id }, 1, 1)).data[0];
  if (!author) throw new NotFoundError('User');
  const comment: Comment = {
    comment_id: ulid(),
    task_id,
    author_id,
    content,
    created_at: new Date().toISOString(),
  };
  const newComment = await commentRepository.insertComment(comment);
  if (!newComment) throw new InternalServerError('Failed to create comment');
  return newComment;
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

// Update comment content
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

// Delete comment
export async function deleteComment(comment_id: string): Promise<void> {
  await getComments({ comment_id }, 0, 1);
  await commentRepository.deleteComment(comment_id);
}
