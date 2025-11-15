import pool from '../db';
import { Tag, TaskTag } from '../models/tag';
import { Task } from '../models/task';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

// Insert new tag
export async function insertTag(tag: Tag): Promise<Tag | null> {
  const result = await pool.query(`
    INSERT INTO tags(tag_id, team_id, name)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
  [tag.tag_id, tag.team_id, tag.name]);
  return result.rows[0] ?? null;
}

// Delete tag
export async function deleteTag(tag_id: string, team_id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE FROM tags
    WHERE tag_id = $1
      AND team_id = $2
  `,
  [tag_id, team_id]);
  return (result.rowCount ?? 0) > 0;
}

// Select tags with optional filters:
// - tag_id
// - team_id
// - name
export async function selectTags(
  filter: { tag_id?: string; team_id?: string; name?: string } = {},
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<Tag>> {
  const conditions: string[] = [];
  const values: any[] = [];  
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    values.push(value);
    conditions.push(`${key} = $${values.length}`);
  });
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;
  const result = await pool.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM tags
    ${where}
    ORDER BY name ASC
    LIMIT $${values.length - 1} OFFSET $${values.length} 
  `,
  values);
  return createPaginatedResult(result.rows, page, pageSize);
}

// Update tag:
// - name
export async function updateTag(
  tag_id: string,
  team_id: string,
  fields: { name: string }
): Promise<Tag | null> {
  const result = await pool.query(`
    UPDATE tags
    SET name = $1
    WHERE tag_id = $2
      AND team_id = $3
    RETURNING *
  `,
  [fields.name, tag_id, team_id]);
  return result.rows[0] ?? null;
}

// Add tag to task
export async function insertTaskTag(taskTag: TaskTag): Promise<TaskTag | null> {
  const result = await pool.query(`
    INSERT INTO task_tags(task_tags_id, task_id, tag_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (task_id, tag_id) DO NOTHING
    RETURNING *
  `,
  [taskTag.task_tags_id, taskTag.task_id, taskTag.tag_id]);
  return result.rows[0] ?? null;
}

// Remove tag from task
export async function deleteTaskTag(task_id: string, tag_id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE FROM task_tags
    WHERE task_id = $1 
      AND tag_id = $2
  `,
  [task_id, tag_id]);
  return (result.rowCount ?? 0) > 0;
}

// Select all tags for a task
export async function selectTagsByTask(task_id: string): Promise<Tag[]> {
  const result = await pool.query(`
    SELECT t.*
    FROM task_tags tt
    JOIN tags t ON tt.tag_id = t.tag_id
    WHERE tt.task_id = $1
    ORDER BY t.name ASC
  `,
  [task_id]);
  return result.rows;
}

// Select all tasks for a tag
export async function selectTasksByTag(
  tag_id: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Task>> {
  const offset = (page - 1) * pageSize;
  const result = await pool.query(`
    SELECT t.*,
           COUNT(*) OVER() as total_count
    FROM task_tags tt
    JOIN tasks t ON tt.task_id = t.task_id
    WHERE tt.tag_id = $1
    ORDER BY t.deadline DESC
    LIMIT $2 OFFSET $3
  `,
  [tag_id, pageSize, offset]);
  return createPaginatedResult<Task>(result.rows, page, pageSize);
}
