import { ulid } from 'ulid';
import * as tagRepository from '../repositories/tag.repository';
import * as teamRepository from '../repositories/team.repository';
import * as taskRepository from '../repositories/task.repository';
import { Tag, TaskTag } from '../models/tag';
import { Task } from '../models/task';

const tagNameRegex = /^[A-Za-z0-9 _-]{1,20}$/;

// Tag name:
// - Between 1 and 20 (inclusive) characters long
// - Only letters, numbers, spaces, underscores, and hyphens allowed
function isValidTagName(name: string): boolean {
  return tagNameRegex.test(name);
}

// Create a tag
// todo: validate permission to create tag (must be team member)
export async function createTag(
  team_id: string,
  name: string
): Promise<Tag> {
  if (!isValidTagName(name)) throw new Error('Invalid tag name');
  // Check if team exists
  const team = (await teamRepository.selectTeams({ team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  // Check if tag name already exists in this team
  const existingTag = (await tagRepository.selectTags({ name, team_id }))[0];
  if (existingTag) throw new Error('Tag name already exists in this team');
  const tag: Tag = {
    tag_id: ulid(),
    team_id,
    name,
  };
  const newTag = await tagRepository.insertTag(tag);
  if (!newTag) throw new Error('Error creating tag');
  return newTag;
}

// Get all tags for a team
// todo: validate permission to view team tags
export async function getTagsByTeam(team_id: string): Promise<Tag[]> {
  const team = (await teamRepository.selectTeams({ team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  return await tagRepository.selectTags({ team_id });
}

// Get tag by ID
// todo: validate permission to view tag
export async function getTagById(tag_id: string, team_id: string): Promise<Tag> {
  const tag = (await tagRepository.selectTags({ tag_id, team_id }))[0];
  if (!tag) throw new Error('Tag not found');
  return tag;
}

// Update tag name
// todo: validate permission to update tag (must be team member)
export async function updateTag(
  tag_id: string,
  team_id: string,
  newName: string
): Promise<Tag> {
  if (!isValidTagName(newName)) throw new Error('Invalid tag name');
  // Check if tag exists
  await getTagById(tag_id, team_id);
  // Check if new name already exists in this team
  const existingTag = (await tagRepository.selectTags({ name: newName, team_id }))[0];
  if (existingTag && existingTag.tag_id !== tag_id) {
    throw new Error('Tag name already exists in this team');
  }
  const updated = await tagRepository.updateTag(tag_id, team_id, { name: newName });
  if (!updated) throw new Error('Error updating tag');
  return updated;
}

// Delete tag
// todo: validate permission to delete tag (must be team member)
export async function deleteTag(tag_id: string, team_id: string): Promise<boolean> {
  // Check if tag exists
  await getTagById(tag_id, team_id);
  return await tagRepository.deleteTag(tag_id, team_id);
}

// Add tag to task
// todo: validate permission (must be team member and task must belong to team)
export async function addTagToTask(
  task_id: string,
  tag_id: string
): Promise<TaskTag> {
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 0, 1))[0];
  if (!task) throw new Error('Task not found');
  // Check if tag exists and belongs to the same team as the task
  const tag = (await tagRepository.selectTags({ tag_id, team_id: task.team_id }))[0];
  if (!tag) throw new Error('Tag not found');
  const taskTag: TaskTag = {
    task_tags_id: ulid(),
    task_id,
    tag_id,
  };
  const newTaskTag = await tagRepository.insertTaskTag(taskTag);
  if (!newTaskTag) throw new Error('Tag already assigned to this task');
  return newTaskTag;
}

// Remove tag from task
// todo: validate permission (must be team member)
export async function removeTagFromTask(
  task_id: string,
  tag_id: string
): Promise<boolean> {
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 0, 1))[0];
  if (!task) throw new Error('Task not found');
  // Check if tag exists
  const tag = (await tagRepository.selectTags({ tag_id, team_id: task.team_id }))[0];
  if (!tag) throw new Error('Tag not found');
  return await tagRepository.deleteTaskTag(task_id, tag_id);
}

// Get all tags for a task
// todo: validate permission to view task tags
export async function getTagsByTask(task_id: string): Promise<Tag[]> {
  // Check if task exists
  const task = (await taskRepository.selectTask({ task_id }, 0, 1))[0];
  if (!task) throw new Error('Task not found');
  return await tagRepository.selectTagsByTask(task_id);
}

// Get all tasks for a tag
// todo: validate permission to view tag tasks
export async function getTasksByTag(tag_id: string, team_id: string): Promise<Task[]> {
  // Check if tag exists
  const tag = (await tagRepository.selectTags({ tag_id, team_id }))[0];
  if (!tag) throw new Error('Tag not found');
  return await tagRepository.selectTasksByTag(tag_id);
}
