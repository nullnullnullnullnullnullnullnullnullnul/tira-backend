import { BaseModel } from './base';

export type TaskStatus = 'pending' | 'ongoing' | 'done' | 'canceled';
export type TaskPriority = 'high' | 'medium' | 'low';
export const validStatuses: TaskStatus[] = ['pending', 'ongoing', 'done', 'canceled'];
export const validPriorities: TaskPriority[] = ['high', 'medium', 'low'];

/**
 * Task entity model
 * Extends BaseModel for compatibility with PaginatedResult
 */
// assigned_to and created_by are nullable because their FK constraints
// declare ON DELETE SET NULL (see migrations/0006_create-tasks.sql).
// Deleting a user does not delete the tasks they created or were
// assigned; the column is zeroed out so the task survives as an
// orphaned-but-readable row. New tasks always carry both fields as
// non-null (createTask requires them at the service layer).
export type Task = BaseModel & {
  task_id: string;
  team_id: string;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  content: string | null;
  last_modified_at: string;
}

/**
 * Filter type for Task queries
 * Uses polymorphic pattern, extending base filterable fields with date range support
 */
export type TaskFilter = Partial<Pick<Task, 'task_id' | 'team_id' | 'assigned_to' | 'created_by' | 'title' | 'status' | 'priority'>> & {
  date_start?: Date;
  date_end?: Date;
}
