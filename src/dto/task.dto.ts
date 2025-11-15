import { TaskStatus, TaskPriority } from '../models/task';
import { PaginationQuery } from './pagination.dto';

export interface ListTasksQuery extends PaginationQuery {
  task_id?: string;
  team_id?: string;
  assigned_to?: string;
  created_by?: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  date_start?: string;
  date_end?: string;
}

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

export interface UpdateTaskBody {
  assigned_to?: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;
  content?: string | null;
}

export interface TaskParams extends Record<string, string> {
  task_id: string;
}
