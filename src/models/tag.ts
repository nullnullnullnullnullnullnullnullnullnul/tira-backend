import { BaseModel } from './base';

/**
 * Tag entity model
 * Extends BaseModel for compatibility with PaginatedResult
 */
export type Tag = BaseModel & {
  tag_id: string;
  team_id: string;
  name: string;
}

/**
 * Filter type for Tag queries
 * Matches the filter shape used in the repository
 */
export type TagFilter = Partial<Pick<Tag, 'tag_id' | 'team_id' | 'name'>>;

/**
 * Junction table type for task-tag relationships
 */
export type TaskTag = {
  task_tags_id: string;
  task_id: string;
  tag_id: string;
}
