import * as activityRepository from '../repositories/activity.repository';
import { TaskHistory } from '../models/activity';
import { PaginatedResult } from '../models/pagination';

/**
 * Get activity history for all tasks in user's teams
 * Flow:
 * 1. Get all task IDs from teams the user belongs to (single optimized query)
 * 2. Return history for those tasks
 */
export async function getUserActivity(
    user_id: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResult<TaskHistory>> {
    // Get all task IDs from teams the user belongs to (single query with JOIN)
    const taskIds = await activityRepository.getTaskIdsByUser(user_id);

    // If no tasks found, return empty result
    if (taskIds.length === 0) {
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

    // Get history for all those tasks
    return await activityRepository.selectTaskHistory(taskIds, page, pageSize);
}
