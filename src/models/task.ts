export type TaskStatus = 'pending' | 'ongoing' | 'done' | 'canceled';
export type TaskPriority = 'high' | 'medium' | 'low';
export const validStatuses: TaskStatus[] = ['pending', 'ongoing', 'done', 'canceled'];
export const validPriorities: TaskPriority[] = ['high', 'medium', 'low'];

export type Task = {
  task_id: string;
  team_id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  content: string | null;
  last_modified_at: string;
}

export type TaskFilter = {
  task_id?: string;
  team_id?: string;
  assigned_to?: string;
  created_by?: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  date_start?: Date;
  date_end?: Date;
}
