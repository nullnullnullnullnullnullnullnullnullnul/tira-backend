import { BaseModel } from './base';

/**
 * Base filter type for polymorphic filter operations
 * Allows creating filters from any model by selecting specific fields
 */
export type BaseFilter<T extends BaseModel> = Partial<Pick<T, keyof T>>;

/**
 * Comment entity model
 * Extends BaseModel for pagination support
 */
// content is NOT NULL (enforced by migration 0016). The service-level
// validation (1-300 chars) already rejects empty content, so the
// schema constraint matches the contract; null comments cannot exist.
// author_id is nullable because the FK is ON DELETE SET NULL: deleting
// the author leaves the comment in place as orphaned-but-readable.
export type Comment = BaseModel & {
  comment_id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
}

/**
 * Filter type for Comment queries
 * Uses polymorphic BaseFilter pattern, restricting to filterable fields only
 */
export type CommentFilter = Partial<Pick<Comment, 'comment_id' | 'task_id' | 'author_id'>>;
