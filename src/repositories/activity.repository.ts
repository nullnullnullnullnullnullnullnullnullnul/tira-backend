import pool from '../db';
import { TaskHistory } from '../models/activity';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

/**
 * Get all task IDs from teams that a user belongs to
 * Uses a single optimized query with JOIN
 */
export async function getTaskIdsByUser(user_id: string): Promise<string[]> {
    const result = await pool.query(`
        SELECT DISTINCT t.task_id
        FROM tasks t
        JOIN team_members tm ON t.team_id = tm.team_id
        WHERE tm.user_id = $1
    `, [user_id]);
    return result.rows.map(row => row.task_id);
}

/**
 * Select task history for multiple tasks
 * Filters by an array of task_ids (from all tasks in user's teams)
 */
export async function selectTaskHistory(
    task_ids: string[],
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResult<TaskHistory>> {
    // If no task_ids provided, return empty result
    if (!task_ids || task_ids.length === 0) {
        return {
            data: [],
            pagination: {
                total: 0,
                page,
                pageSize,
                totalPages: 0
            }
        };
    }
    const offset = (page - 1) * pageSize;
    // Create placeholders for the IN clause: $1, $2, $3, etc.
    const placeholders = task_ids.map((_, index) => `$${index + 1}`).join(', ');
    // Values array: task_ids + pageSize + offset
    const values = [...task_ids, pageSize, offset];
    const result = await pool.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM task_history
    WHERE task_id IN (${placeholders})
    ORDER BY changed_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
    return createPaginatedResult(result.rows, page, pageSize);
}
