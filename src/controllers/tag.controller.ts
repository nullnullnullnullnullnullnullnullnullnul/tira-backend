import { Request, Response } from 'express';
import * as tagService from '../services/tags.service';
import { Tag, TaskTag } from '../models/tag';
import { Task } from '../models/task';
import {
  CreateTagParams,
  CreateTagBody,
  GetTagsByTeamParams,
  GetTagByIdParams,
  UpdateTagParams,
  UpdateTagBody,
  DeleteTagParams,
  AddTagToTaskParams,
  AddTagToTaskBody,
  RemoveTagFromTaskParams,
  GetTagsByTaskParams,
  GetTasksByTagParams
} from '../dto/tag.dto';

// POST /teams/:team_id/tags
export async function createTag(
  req: Request<CreateTagParams, {}, CreateTagBody>,
  res: Response<Tag | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const { name } = req.body;
    const tag = await tagService.createTag(team_id, name);
    res.status(201).json(tag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/tags
export async function getTagsByTeam(
  req: Request<GetTagsByTeamParams>,
  res: Response<Tag[] | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const tags = await tagService.getTagsByTeam(team_id);
    res.json(tags);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/tags/:tag_id
export async function getTagById(
  req: Request<GetTagByIdParams>,
  res: Response<Tag | { error: string }>
) {
  try {
    const { tag_id, team_id } = req.params;
    const tag = await tagService.getTagById(tag_id, team_id);
    res.json(tag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /teams/:team_id/tags/:tag_id
export async function updateTag(
  req: Request<UpdateTagParams, {}, UpdateTagBody>,
  res: Response<Tag | { error: string }>
) {
  try {
    const { tag_id, team_id } = req.params;
    const { name } = req.body;
    const tag = await tagService.updateTag(tag_id, team_id, name);
    res.json(tag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /teams/:team_id/tags/:tag_id
export async function deleteTag(
  req: Request<DeleteTagParams>,
  res: Response<{ success: true } | { error: string }>
) {
  try {
    const { tag_id, team_id } = req.params;
    const success = await tagService.deleteTag(tag_id, team_id);
    if (!success) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// POST /tasks/:task_id/tags
export async function addTagToTask(
  req: Request<AddTagToTaskParams, {}, AddTagToTaskBody>,
  res: Response<TaskTag | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const { tag_id } = req.body;
    const taskTag = await tagService.addTagToTask(task_id, tag_id);
    res.status(201).json(taskTag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /tasks/:task_id/tags/:tag_id
export async function removeTagFromTask(
  req: Request<RemoveTagFromTaskParams>,
  res: Response<undefined | { error: string }>
) {
  try {
    const { task_id, tag_id } = req.params;
    const success = await tagService.removeTagFromTask(task_id, tag_id);
    if (!success) return res.status(404).json({ error: 'Tag not found on task' });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /tasks/:task_id/tags
export async function getTagsByTask(
  req: Request<GetTagsByTaskParams>,
  res: Response<Tag[] | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const tags = await tagService.getTagsByTask(task_id);
    res.json(tags);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/tags/:tag_id/tasks
export async function getTasksByTag(
  req: Request<GetTasksByTagParams>,
  res: Response<Task[] | { error: string }>
) {
  try {
    const { tag_id, team_id } = req.params;
    const tasks = await tagService.getTasksByTag(tag_id, team_id);
    res.json(tasks);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
