import { TaskStatus, TaskPriority } from '../models/task';
import { PaginatedQuery, PathParams } from './base.dto';

export type ListTasksQuery = PaginatedQuery<{
  task_id?: string;
  team_id?: string;
  assigned_to?: string;
  created_by?: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  date_start?: string;
  date_end?: string;
}>;

export interface CreateTaskBody {
  created_by: string;
  team_id: string;
  assigned_to: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  content?: string | null;
}

type EditableTaskFields = Omit<CreateTaskBody, 'created_by' | 'team_id'>;

export type UpdateTaskBody = Partial<EditableTaskFields>;

export type TaskParams = PathParams<'task_id'>;
