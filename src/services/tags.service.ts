import { ulid } from 'ulid';
import * as tagRepository from '../repositories/tag.repository';
import * as teamRepository from '../repositories/team.repository';
import * as taskRepository from '../repositories/task.repository';
import { Tag, TaskTag } from '../models/tag';
import { Task } from '../models/task';
import { PaginatedResult } from '../models/pagination';
import { NotFoundError, ValidationError, ConflictError, InternalServerError } from '../utils/AppError';
import { withAuditedTransaction } from '../utils/transaction';

const tagNameRegex = /^[A-Za-z0-9 _-]{1,20}$/;

// Tag name:
// - Between 1 and 20 (inclusive) characters long
// - Only letters, numbers, spaces, underscores, and hyphens allowed
function isValidTagName(name: string): boolean {
  return tagNameRegex.test(name);
}

// Create a tag.
//
// Not wrapped in withAuditedTransaction: INSERT tags does not fire
// any audit trigger (the trigger in migration 0012 is on task_tags,
// not tags itself), so there is nothing to attribute. The two reads
// before the INSERT are an existence check and a uniqueness check;
// the UNIQUE (team_id, name) constraint already prevents the race
// from creating duplicates.
//
// todo: validate permission to create tag (must be team member)
export async function createTag(
  team_id: string,
  name: string
): Promise<Tag> {
  if (!isValidTagName(name)) throw new ValidationError('Invalid tag name');
  // Check if team exists
  const team = (await teamRepository.selectTeams({ team_id }, 1, 1)).data[0];
  if (!team) throw new NotFoundError('Team');
  // Check if tag name already exists in this team
  const existingTag = (await tagRepository.selectTags({ name, team_id }, 1, 1)).data[0];
  if (existingTag) throw new ConflictError('Tag name already exists in this team');
  const tag: Tag = {
    tag_id: ulid(),
    team_id,
    name,
  };
  const newTag = await tagRepository.insertTag(tag);
  if (!newTag) throw new InternalServerError('Failed to create tag');
  return newTag;
}

// Get all tags for a team
// todo: validate permission to view team tags
export async function getTagsByTeam(
  team_id: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Tag>> {
  const team = (await teamRepository.selectTeams({ team_id }, 1, 1)).data[0];
  if (!team) throw new NotFoundError('Team');
  return await tagRepository.selectTags({ team_id }, page, pageSize);
}

// Get tag by ID
// todo: validate permission to view tag
export async function getTagById(tag_id: string, team_id: string): Promise<Tag> {
  const tag = (await tagRepository.selectTags({ tag_id, team_id }, 1, 1)).data[0];
  if (!tag) throw new NotFoundError('Tag');
  return tag;
}

// Update tag name.
//
// Not wrapped in a transaction: UPDATE tags does not fire any audit
// trigger.
// todo: validate permission to update tag (must be team member)
export async function updateTag(
  tag_id: string,
  team_id: string,
  newName: string
): Promise<Tag> {
  if (!isValidTagName(newName)) throw new ValidationError('Invalid tag name');
  // Check if tag exists
  await getTagById(tag_id, team_id);
  // Check if new name already exists in this team
  const existingTag = (await tagRepository.selectTags({ name: newName, team_id }, 1, 1)).data[0];
  if (existingTag && existingTag.tag_id !== tag_id) {
    throw new ConflictError('Tag name already exists in this team');
  }
  const updated = await tagRepository.updateTag(tag_id, team_id, { name: newName });
  if (!updated) throw new NotFoundError('Tag');
  return updated;
}

// Delete tag.
//
// Not wrapped in a transaction: DELETE tags does not fire any audit
// trigger directly. The CASCADE to task_tags WILL fire the
// log_tag_activity_fn trigger for each removed link, but those rows
// will record changed_by = NULL because the deletion path is not
// under withAuditedTransaction. That tradeoff is documented in the
// migration; the alternative (wrapping every cascading delete) is
// more code than the audit value justifies for this project.
// todo: validate permission to delete tag (must be team member)
export async function deleteTag(tag_id: string, team_id: string): Promise<void> {
  // Check if tag exists
  await getTagById(tag_id, team_id);
  await tagRepository.deleteTag(tag_id, team_id);
}

// Add tag to task.
//
// Wrapped in withAuditedTransaction because INSERT task_tags fires
// the log_tag_activity_fn trigger, which reads the
// app.current_user_id session variable for changed_by attribution.
// todo: validate permission (must be team member and task must belong to team)
export async function addTagToTask(
  actingUserId: string | undefined,
  task_id: string,
  tag_id: string
): Promise<TaskTag> {
  return withAuditedTransaction(actingUserId, async (db) => {
    // Check if task exists
    const task = (await taskRepository.selectTask({ task_id }, 1, 1, db)).data[0];
    if (!task) throw new NotFoundError('Task');
    // Check if tag exists and belongs to the same team as the task
    const tag = (await tagRepository.selectTags({ tag_id, team_id: task.team_id }, 1, 1, db)).data[0];
    if (!tag) throw new NotFoundError('Tag');
    const taskTag: TaskTag = {
      task_tags_id: ulid(),
      task_id,
      tag_id,
    };
    const newTaskTag = await tagRepository.insertTaskTag(taskTag, db);
    if (!newTaskTag) throw new ConflictError('Tag already assigned to this task');
    return newTaskTag;
  });
}

// Remove tag from task.
//
// Wrapped in withAuditedTransaction because DELETE task_tags fires
// the log_tag_activity_fn trigger.
// todo: validate permission (must be team member)
export async function removeTagFromTask(
  actingUserId: string | undefined,
  task_id: string,
  tag_id: string
): Promise<void> {
  await withAuditedTransaction(actingUserId, async (db) => {
    // Check if task exists
    const task = (await taskRepository.selectTask({ task_id }, 1, 1, db)).data[0];
    if (!task) throw new NotFoundError('Task');
    // Check if tag exists
    const tag = (await tagRepository.selectTags({ tag_id, team_id: task.team_id }, 1, 1, db)).data[0];
    if (!tag) throw new NotFoundError('Tag');
    await tagRepository.deleteTaskTag(task_id, tag_id, db);
  });
}

// Get all tags for a task
// todo: validate permission to view task tags
export async function getTagsByTask(task_id: string): Promise<Tag[]> {
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 1, 1)).data[0];
  if (!task) throw new NotFoundError('Task');
  return await tagRepository.selectTagsByTask(task_id);
}

// Get all tasks for a tag
// todo: validate permission to view tag tasks
export async function getTasksByTag(
  tag_id: string,
  team_id: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Task>> {
  // Check if tag exists
  const tag = (await tagRepository.selectTags({ tag_id, team_id }, 1, 1)).data[0];
  if (!tag) throw new NotFoundError('Tag');
  return await tagRepository.selectTasksByTag(tag_id, page, pageSize);
}
