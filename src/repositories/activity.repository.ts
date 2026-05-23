import pool, { Executor } from '../db';
import { TaskHistory } from '../models/activity';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

/**
 * Get all task IDs from teams that a user belongs to
 * Uses a single optimized query with JOIN
 */
export async function getTaskIdsByUser(user_id: string, db: Executor = pool): Promise<string[]> {
    const result = await db.query(`
        SELECT DISTINCT t.task_id
        FROM tasks t
        JOIN team_members tm ON t.team_id = tm.team_id
        WHERE tm.user_id = $1
    `, [user_id]);
    return result.rows.map(row => row.task_id);
}

/**
 * Select task history for multiple tasks
 * Filters by an array of task_ids (from all tasks in user's teams).
 *
 * The task_ids array is bound as a single text[] parameter and the
 * filter uses `WHERE task_id = ANY($1::text[])`. This is the
 * idiomatic Postgres shape for "match any of these values":
 * - One parameter instead of N placeholders built by string concat
 * - No upper bound on array length tied to the protocol's parameter
 *   limit
 * - Same plan as `IN (...)` for an indexed column
 */
export async function selectTaskHistory(
    task_ids: string[],
    page: number = 1,
    pageSize: number = 20,
    db: Executor = pool,
): Promise<PaginatedResult<TaskHistory>> {
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
    const result = await db.query(`
    SELECT *,
      COUNT(*) OVER() AS total_count
    FROM task_history
    WHERE task_id = ANY($1::text[])
    ORDER BY changed_at DESC
    LIMIT $2 OFFSET $3
  `, [task_ids, pageSize, offset]);
    return createPaginatedResult(result.rows, page, pageSize);
}
