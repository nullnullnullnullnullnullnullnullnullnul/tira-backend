import { BaseModel } from './base';

/**
 * Task History entity model
 * Represents a historical change record for tasks
 * Extends BaseModel for compatibility with PaginatedResult
 */
export type TaskHistory = BaseModel & {
    history_id: string;
    task_id: string;
    change_type: 'UPDATE' | 'CREATE' | 'DELETE';
    entity: 'TASK' | 'COMMENT' | 'TAG';
    field: string | null;
    old_value: string | null;
    new_value: string | null;
    changed_at: Date;
}
