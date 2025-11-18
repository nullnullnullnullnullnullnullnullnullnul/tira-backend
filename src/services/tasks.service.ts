import { ulid } from 'ulid';
import * as taskRepository from '../repositories/task.repository';
import * as teamRepository from '../repositories/team.repository';
import * as userRepository from '../repositories/user.repository';
import { Task, TaskFilter, TaskStatus, TaskPriority, validPriorities, validStatuses } from '../models/task';
import { PaginatedResult } from '../models/pagination';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/AppError';

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

// Create a task
export async function createTask(
  created_by: string,
  fields: Omit<Task, 'task_id' | 'created_by' | 'last_modified_at'>
): Promise<Task> {
  if (!isValidTitle(fields.title)) throw new ValidationError('Invalid task title');
  if (!isValidStatus(fields.status)) throw new ValidationError('Invalid task status');
  if (!isValidPriority(fields.priority)) throw new ValidationError('Invalid task priority');
  if (!isValidDeadline(fields.deadline)) throw new ValidationError('Invalid deadline');
  // Check if creator exists
  const creator = (await userRepository.selectUsers({ user_id: created_by }, 1, 1)).data[0];
  if (!creator) throw new NotFoundError('User');
  // Check if team exists
  const team = (await teamRepository.selectTeams({ team_id: fields.team_id }, 1, 1)).data[0];
  if (!team) throw new NotFoundError('Team');
  // Check if assigned user exists
  const assignedUser = (await userRepository.selectUsers({ user_id: fields.assigned_to }, 1, 1)).data[0];
  if (!assignedUser) throw new NotFoundError('User');
  // Check if assigned user is a member of the team
  const members = await teamRepository.selectMembers(fields.team_id);
  if (!members.data.find(m => m.user_id === fields.assigned_to)) {
    throw new Error('Assigned user is not a member of the team');
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
  const newTask = await taskRepository.insertTask(task);
  if (!newTask) throw new InternalServerError('Failed to create task');
  return newTask;
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

// Update task
// todo: validate permission to update task
export async function updateTask(
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
  // Check if task exists
  const task = await getTaskById(task_id);
  // If updating assigned_to, validate the user exists and is a team member
  if (fields.assigned_to !== undefined) {
    const assignedUser = (await userRepository.selectUsers({ user_id: fields.assigned_to }, 1, 1)).data[0];
    if (!assignedUser) throw new NotFoundError('Assigned user');
    const members = await teamRepository.selectMembers(task.team_id);
    if (!members.data.find(m => m.user_id === fields.assigned_to)) {
      throw new ValidationError('Assigned user is not a member of the team');
    }
  }
  const updated = await taskRepository.updateTask(task_id, fields);
  if (!updated) throw new NotFoundError('Task');
  return updated;
}

// Delete task
export async function deleteTask(task_id: string): Promise<void> {
  await getTaskById(task_id); // Throws NotFoundError
  await taskRepository.deleteTask(task_id);
}
