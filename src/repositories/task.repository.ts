import pool from '../db';
import { Task, TaskFilter } from '../models/task';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

// Select task by:
// - name
// - task_id
// - team_id
// - created_by
// - assigned_to
// - user
// - tag
// - %title%
// - status
// - priority
// - deadline
// FIX DEADLINE FILTER
export async function selectTask(
  filter: TaskFilter = {},
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<Task>> {
  const conditions: string[] = [];
  const values: any[] = [];
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'title') {
      values.push(`%${value}%`);
      conditions.push(`title ILIKE $${values.length}`);
    } else if (key === 'date_start') {
      // deadline >= date_start
      values.push((value as Date).toISOString());
      conditions.push(`deadline >= $${values.length}`);
    } else if (key === 'date_end') {
      // deadline <= date_end
      values.push((value as Date).toISOString());
      conditions.push(`deadline <= $${values.length}`);
    } else {
      values.push(value);
      conditions.push(`${key} = $${values.length}`);
    }
  });
  const where: string = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // Pagination
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await pool.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM tasks
    ${where}
    ORDER BY deadline DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );
  return createPaginatedResult<Task>(result.rows, page, pageSize);
}

// Add task
export async function insertTask(task: Task): Promise<Task | null> {
  const result = await pool.query(`
    INSERT INTO tasks(
      task_id,
      team_id,
      assigned_to,
      created_by,
      title,
      description,
      status,
      priority,
      deadline,
      content,
      last_modified_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    ) RETURNING *
    `,
    [task.task_id, task.team_id, task.assigned_to, task.created_by,
    task.title, task.description, task.status, task.priority,
    task.deadline, task.content, task.last_modified_at]
  );
  return result.rows[0] ?? null;
}

// Remove task
export async function deleteTask(task_id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE 
    FROM tasks 
    WHERE task_id = $1
    `,
    [task_id]
  );
  return (result.rowCount ?? 0) > 0;
}

// Update task
// - assigned_to
// - title
// - description
// - status
// - priority
// - deadline
// - content
export async function updateTask(
  task_id: string,
  fields: Partial<Omit<Task, 'task_id' | 'team_id' | 'created_by' | 'last_modified_at'>>
): Promise<Task | null> {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  // keys = ["title", "status", "deadline"]
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  // setClauses = ["title = $1", "status = $2", "deadline = $3"]
  const values = keys.map(k => {
    const val = (fields as any)[k];
    return val instanceof Date ? val.toISOString() : val;
  });
  const result = await pool.query(`
      UPDATE tasks
      SET ${setClauses.join(', ')}, last_modified_at = NOW()
      WHERE task_id = $${keys.length + 1}
      RETURNING *;
    `,
    [...values, task_id]
  );
  return result.rows[0] ?? null;
}
