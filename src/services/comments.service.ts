import { ulid } from 'ulid';
import * as commentRepository from '../repositories/comment.repository';
import * as taskRepository from '../repositories/task.repository';
import * as userRepository from '../repositories/user.repository';
import { Comment, CommentFilter } from '../models/comment';

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
    throw new Error('Comment content must be between 1 and 300 characters');
  }  
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 0, 1))[0];
  if (!task) throw new Error('Task not found');
  // Check if author exists
  const author = (await userRepository.selectUsers({ user_id: author_id }, 0, 1))[0];
  if (!author) throw new Error('User not found');
  const comment: Comment = {
    comment_id: ulid(),
    task_id,
    author_id,
    content,
    created_at: new Date().toISOString(),
  };
  const newComment = await commentRepository.insertComment(comment);
  if (!newComment) throw new Error('Error creating comment');
  return newComment;
}

// Get comments with optional filters
// todo: validate permissions based on filter type
export async function getComments(
  filter: CommentFilter = {},
  offset: number = 0,
  limit: number = 20
): Promise<Comment[]> {
  if (filter.task_id) {
    const task = (await taskRepository.selectTask({ task_id: filter.task_id }, 0, 1))[0];
    if (!task) throw new Error('Task not found');
  }
  if (filter.author_id) {
    const author = (await userRepository.selectUsers({ user_id: filter.author_id }, 0, 1))[0];
    if (!author) throw new Error('User not found');
  }
  const comments = await commentRepository.selectComments(filter, offset, limit);
  if (filter.comment_id && comments.length === 0) {
    throw new Error('Comment not found');
  }
  return comments;
}

// Update comment content
// todo: validate permission to update comment (must be author or team leader)
export async function updateComment(
  comment_id: string,
  content: string
): Promise<Comment> {
  if (!content || !isValidCommentContent(content)) {
    throw new Error('Comment content must be between 1 and 300 characters');
  }  
  // Check if comment exists
  await getComments({ comment_id }, 0, 1);
  const updated = await commentRepository.updateComment(comment_id, content);
  if (!updated) throw new Error('Error updating comment');
  return updated;
}

// Delete comment
// todo: validate permission to delete comment (must be author or team leader)
export async function deleteComment(comment_id: string): Promise<boolean> {
  // Check if comment exists
  await getComments({ comment_id }, 0, 1);
  return await commentRepository.deleteComment(comment_id);
}
