import { ulid } from 'ulid';
import * as taskRepository from '../repositories/task.repository';
import * as teamRepository from '../repositories/team.repository';
import * as userRepository from '../repositories/user.repository';
import { Task, TaskFilter, TaskStatus, TaskPriority, validPriorities, validStatuses } from '../models/task';
import { PaginatedResult } from '../models/pagination';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/AppError';
import { withAuditedTransaction } from '../utils/transaction';

const titleRegex = /^[a-z0-9 ]{3,100}$/i;

// Task title:
// - Between 3 and 100 (inclusive) characters long
// - Allows  only letters and digits (a-z, 0-9)
// - Allows " "
// - case insensitive
function isValidTitle(title: string): boolean {
  return titleRegex.test(title);
}

function isValidStatus(status: TaskStatus): boolean {
  return validStatuses.includes(status);
}

function isValidPriority(priority: TaskPriority): boolean {
  return validPriorities.includes(priority);
}

function isValidDeadline(deadline: string): boolean {
  const date = new Date(deadline);
  return !isNaN(date.getTime());
}

// Create a task.
//
// Runs all the existence/membership checks and the final INSERT inside
// a single transaction so a race between selectMembers and insertTask
// cannot leave behind a task assigned to a now-non-member. The
// actingUserId becomes app.current_user_id for the transaction, which
// the audit triggers read for changed_by attribution; pass undefined
// when there is no authenticated caller and the audit row will record
// changed_by NULL.
// The Task model declares assigned_to as nullable to reflect the
// ON DELETE SET NULL behaviour at the database, but createTask
// requires a non-null assignee at creation time. Intersect to
// override just that one field.
type CreateTaskFields = Omit<Task, 'task_id' | 'created_by' | 'last_modified_at' | 'assigned_to'> & {
  assigned_to: string;
};

export async function createTask(
  actingUserId: string | undefined,
  created_by: string,
  fields: CreateTaskFields,
): Promise<Task> {
  if (!isValidTitle(fields.title)) throw new ValidationError('Invalid task title');
  if (!isValidStatus(fields.status)) throw new ValidationError('Invalid task status');
  if (!isValidPriority(fields.priority)) throw new ValidationError('Invalid task priority');
  if (!isValidDeadline(fields.deadline)) throw new ValidationError('Invalid deadline');

  return withAuditedTransaction(actingUserId, async (db) => {
    // Check if creator exists
    const creator = (await userRepository.selectUsers({ user_id: created_by }, 1, 1, db)).data[0];
    if (!creator) throw new NotFoundError('User');
    // Check if team exists
    const team = (await teamRepository.selectTeams({ team_id: fields.team_id }, 1, 1, db)).data[0];
    if (!team) throw new NotFoundError('Team');
    // Check if assigned user exists
    const assignedUser = (await userRepository.selectUsers({ user_id: fields.assigned_to }, 1, 1, db)).data[0];
    if (!assignedUser) throw new NotFoundError('User');
    // Check if assigned user is a member of the team
    if (!(await teamRepository.isTeamMember(fields.team_id, fields.assigned_to, db))) {
      throw new ValidationError('Assigned user is not a member of the team');
    }
    const task: Task = {
      task_id: ulid(),
      team_id: fields.team_id,
      assigned_to: fields.assigned_to,
      created_by,
      title: fields.title,
      description: fields.description ?? null,
      status: fields.status,
      priority: fields.priority,
      deadline: fields.deadline,
      content: fields.content ?? null,
      last_modified_at: new Date().toISOString(),
    };
    const newTask = await taskRepository.insertTask(task, db);
    if (!newTask) throw new InternalServerError('Failed to create task');
    return newTask;
  });
}

// Get tasks with filters
// FIX DEADLINE FILTER
export async function getTasks(
  filter: TaskFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Task>> {
  return await taskRepository.selectTask(filter, page, pageSize);
}

// Get a single task by ID
export async function getTaskById(task_id: string): Promise<Task> {
  const result = await taskRepository.selectTask({ task_id }, 1, 1);
  if (!result.data[0]) throw new NotFoundError('Task');
  return result.data[0];
}

// Update task.
//
// Runs membership validation (when assigned_to is changing) and the
// UPDATE inside a single transaction so the audit trigger sees the
// SET LOCAL app.current_user_id from withAuditedTransaction and
// records changed_by accordingly. Without the transaction the SET
// goes to one pooled connection and the UPDATE to another, so the
// trigger would see NULL.
// todo: validate permission to update task
export async function updateTask(
  actingUserId: string | undefined,
  task_id: string,
  fields: Partial<Omit<Task, 'task_id' | 'team_id' | 'created_by' | 'last_modified_at'>>
): Promise<Task> {
  if (Object.keys(fields).length === 0) throw new ValidationError('No fields to update');
  // Validate fields if provided
  if (fields.title !== undefined && !isValidTitle(fields.title)) {
    throw new ValidationError('Invalid task title');
  }
  if (fields.status !== undefined && !isValidStatus(fields.status)) {
    throw new ValidationError('Invalid task status');
  }
  if (fields.priority !== undefined && !isValidPriority(fields.priority)) {
    throw new ValidationError('Invalid task priority');
  }
  if (fields.deadline !== undefined && !isValidDeadline(fields.deadline)) {
    throw new ValidationError('Invalid deadline');
  }

  return withAuditedTransaction(actingUserId, async (db) => {
    // Check if task exists (inside the transaction so a concurrent
    // delete cannot win between the check and the UPDATE)
    const taskResult = await taskRepository.selectTask({ task_id }, 1, 1, db);
    const task = taskResult.data[0];
    if (!task) throw new NotFoundError('Task');
    // If updating assigned_to to a real user, validate they exist and
    // are a team member. assigned_to = null means "unassign" and skips
    // the membership check (FK is ON DELETE SET NULL, NULL is valid).
    if (fields.assigned_to !== undefined && fields.assigned_to !== null) {
      const newAssignee = fields.assigned_to;
      const assignedUser = (await userRepository.selectUsers({ user_id: newAssignee }, 1, 1, db)).data[0];
      if (!assignedUser) throw new NotFoundError('Assigned user');
      if (!(await teamRepository.isTeamMember(task.team_id, newAssignee, db))) {
        throw new ValidationError('Assigned user is not a member of the team');
      }
    }
    const updated = await taskRepository.updateTask(task_id, fields, db);
    if (!updated) throw new NotFoundError('Task');
    return updated;
  });
}

// Delete task.
//
// Wrapped in withAuditedTransaction even though the observable effect
// on task_history is nil: the CASCADE from tasks to task_tags fires
// log_tag_activity_fn for each detached tag (which writes a
// task_history row with changed_by = acting_user thanks to the
// set_config), but the CASCADE from tasks to task_history then wipes
// every history row for the now-gone task in the same transaction.
// The wrap matters anyway because (a) the brief in-transaction window
// has the correct attribution, (b) it is the right pattern to copy
// for the next contributor adding an audited write path, and (c) if
// the cascade rule on task_history.task_id ever changes to
// ON DELETE SET NULL (one possible fix for the "task deletion leaves
// no surviving trail" gap documented in docs/database/decisions.md),
// the attribution becomes observable for free.
export async function deleteTask(
  actingUserId: string | undefined,
  task_id: string,
): Promise<void> {
  return withAuditedTransaction(actingUserId, async (db) => {
    const task = (await taskRepository.selectTask({ task_id }, 1, 1, db)).data[0];
    if (!task) throw new NotFoundError('Task');
    await taskRepository.deleteTask(task_id, db);
  });
}
